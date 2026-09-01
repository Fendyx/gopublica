const express = require('express');
const router = express.Router();
const PlatformOrder = require('../../models/platform/PlatformOrder');
const PlatformProduct = require('../../models/platform/PlatformProduct');
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/auth/tenant');
const auth = require('../../middleware/auth/jwt');
const { Stripe } = require('../../services/payments/stripe');

const DELIVERY_FEES = {
  parcel_locker: 14.99,
  courier: 19.99,
  cash_on_delivery: 30.00,
};

// ─── POST /api/platform/orders — create order ─────────────────────────────
router.post('/', authTenant, async (req, res) => {
  try {
    const { tenantId } = req;
    const { items, paymentMethod, buyerType, nip, businessName, fulfillment, notes } = req.body;

    // ── Validate items ──
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // ── Validate payment method ──
    if (!paymentMethod || !['stripe', 'cash_on_delivery'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method is required (stripe or cash_on_delivery)' });
    }

    // ── Validate buyer type ──
    if (!buyerType || !['private', 'business'].includes(buyerType)) {
      return res.status(400).json({ error: 'buyerType must be "private" or "business"' });
    }
    if (buyerType === 'business') {
      if (!nip || !businessName) {
        return res.status(400).json({ error: 'Business orders require nip and businessName' });
      }
    }

    // ── Validate fulfillment ──
    if (!fulfillment || !fulfillment.type) {
      return res.status(400).json({ error: 'fulfillment.type is required' });
    }

    // Calculate delivery fee
    let deliveryFee = DELIVERY_FEES[fulfillment.type] || 0;

    if (paymentMethod === 'stripe') {
      if (!['parcel_locker', 'courier'].includes(fulfillment.type)) {
        return res.status(400).json({ error: 'Stripe payments require parcel_locker or courier delivery' });
      }
      if (fulfillment.type === 'parcel_locker') {
        if (!fulfillment.parcelLocker?.lockerId || !fulfillment.parcelLocker?.network) {
          return res.status(400).json({ error: 'Parcel locker requires lockerId and network' });
        }
      }
      if (fulfillment.type === 'courier') {
        if (!fulfillment.address?.name || !fulfillment.address?.phone || !fulfillment.address?.email || !fulfillment.address?.street || !fulfillment.address?.city || !fulfillment.address?.zip) {
          return res.status(400).json({ error: 'Courier delivery requires full address (name, phone, email, street, city, zip)' });
        }
      }
    }

    if (paymentMethod === 'cash_on_delivery') {
      if (fulfillment.type !== 'cash_on_delivery') {
        return res.status(400).json({ error: 'COD payment requires cash_on_delivery fulfillment type' });
      }
      // COD: no address needed, GoPublica knows the tenant
      deliveryFee = DELIVERY_FEES.cash_on_delivery;
    }

    // ── Fetch tenant for pre-fill + business name snapshot ──
    const tenant = await TenantSettings.findOne({ tenantId }).lean();

    // ── Validate products & build frozen snapshots ──
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await PlatformProduct.findOne({ _id: item.productId, isActive: true }).lean();
      if (!product) {
        return res.status(404).json({ error: `Product not found or inactive: ${item.productId}` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: qty,
        photo: product.photo || '',
      });
      subtotal += product.price * qty;
    }

    const currency = orderItems.length > 0
      ? (await PlatformProduct.findById(orderItems[0].productId).lean())?.currency || 'PLN'
      : 'PLN';

    const total = subtotal + deliveryFee;

    // ── Create order ──
    const order = new PlatformOrder({
      tenantId,
      tenantName: tenant?.businessName || '',
      buyerType,
      businessName: buyerType === 'business' ? (businessName || '') : '',
      nip: buyerType === 'business' ? (nip || '') : '',
      items: orderItems,
      paymentMethod,
      fulfillment: {
        type: fulfillment.type,
        parcelLocker: fulfillment.type === 'parcel_locker' ? {
          enabled: true,
          lockerId: fulfillment.parcelLocker.lockerId,
          network: fulfillment.parcelLocker.network,
          address: fulfillment.parcelLocker.address || {},
        } : { enabled: false },
        address: fulfillment.type === 'courier' ? {
          name: fulfillment.address.name || '',
          phone: fulfillment.address.phone || '',
          email: fulfillment.address.email || '',
          street: fulfillment.address.street || '',
          city: fulfillment.address.city || '',
          zip: fulfillment.address.zip || '',
        } : {},
        deliveryFee,
      },
      pricing: {
        subtotal,
        deliveryFee,
        total,
        currency,
      },
      notes: notes || '',
    });

    await order.save();

    // ── Stripe: create PaymentIntent ──
    if (paymentMethod === 'stripe') {
      const amountInGroszy = Math.round(total * 100);

      const paymentIntent = await Stripe.paymentIntents.create({
        amount: amountInGroszy,
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          platformOrderId: order._id.toString(),
          tenantId,
          type: 'platform_order',
        },
      });

      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();

      return res.status(201).json({
        orderId: order._id,
        clientSecret: paymentIntent.client_secret,
      });
    }

    // ── Cash on Delivery ──
    res.status(201).json({
      orderId: order._id,
      message: 'Order placed. Payment will be collected on delivery.',
    });
  } catch (err) {
    console.error('POST /api/platform/orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Tenant: list my orders ────────────────────────────────────────────────
router.get('/my', authTenant, async (req, res) => {
  try {
    const orders = await PlatformOrder.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tenant: get single order detail ───────────────────────────────────────
router.get('/my/:id', authTenant, async (req, res) => {
  try {
    const order = await PlatformOrder.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: list all orders ────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, paymentMethod, tenantId } = req.query;
    const filter = {};

    if (status) filter.orderStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (tenantId) filter.tenantId = tenantId;

    const orders = await PlatformOrder.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: get single order ───────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await PlatformOrder.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: update order status ────────────────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await PlatformOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.orderStatus = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: mark COD order as paid ─────────────────────────────────────────
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const order = await PlatformOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.paymentMethod !== 'cash_on_delivery') {
      return res.status(400).json({ error: 'Can only mark COD orders as paid' });
    }

    order.paymentStatus = 'paid';
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: update fulfillment notes ───────────────────────────────────────
router.put('/:id/notes', auth, async (req, res) => {
  try {
    const { fulfillmentNotes } = req.body;
    const order = await PlatformOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.fulfillmentNotes = fulfillmentNotes || '';
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
