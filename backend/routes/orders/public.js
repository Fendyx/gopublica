const express = require('express');
const router = express.Router();
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const CustomerUser = require('../../models/CustomerUser');
const TenantSettings = require('../../models/TenantSettings');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ==============================
// ЕДИНАЯ ФУНКЦИЯ РАСЧЁТА ЦЕНЫ
// ==============================
function calculateFees(subtotal, deliveryFee, tenant) {
  const platformFeePercent = (tenant?.payments?.platformFeePercent ?? 5) / 100;
  const stripePct = (tenant?.payments?.stripeFeePercent ?? 3.25) / 100;
  const stripeFix = tenant?.payments?.stripeFeeFixed ?? 1.0;

  const baseAmount = subtotal + deliveryFee;
  const platformFee = Math.round(subtotal * platformFeePercent * 100) / 100;
  const stripeFee = Math.round((baseAmount * stripePct + stripeFix) * 100) / 100;
  const serviceFee = Math.round((platformFee + stripeFee) * 100) / 100;
  const total = Math.round((baseAmount + serviceFee) * 100) / 100;

  return {
    subtotal,
    deliveryFee,
    platformFee,
    stripeFee,
    serviceFee,
    total,
  };
}

// ==============================
// MIDDLEWARE: определение тенанта
// ==============================
async function getTenant(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) return res.status(400).json({ error: 'x-tenant-id header is required' });

  const tenant = await TenantSettings.findOne({ tenantId }).lean();
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  req.tenantId = tenantId;
  req.tenant = tenant;
  next();
}

// ==============================
// 1. ESTIMATE – точный расчёт суммы
// ==============================
router.post('/estimate', getTenant, (req, res) => {
  try {
    const { subtotal = 0, deliveryFee = 0 } = req.body;

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return res.status(400).json({ error: 'Invalid subtotal' });
    }

    const fees = calculateFees(subtotal, deliveryFee, req.tenant);
    res.json(fees);
  } catch (err) {
    console.error('Estimate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 2. СОЗДАНИЕ ЗАКАЗА (С Auth)
// ==============================
router.post('/', getTenant, async (req, res) => {
  try {
    const { tenantId, tenant } = req;
    if (!tenant.features?.hasOnlineOrdering) {
      return res.status(403).json({ error: 'Online ordering is disabled' });
    }

    const {
      branchId,
      fulfillment,
      items,
      customer: customerInput,
      password, // НОВОЕ ПОЛЕ
      locale = 'pl',
      consents // НОВОЕ ПОЛЕ
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (!customerInput || !customerInput.email || !customerInput.phone || !customerInput.name) {
      return res.status(400).json({ error: 'Customer name, email and phone are required' });
    }

    // --- Auth & GDPR Логика ---
    let customerUserId = null;
    let authToken = null;

    if (password && consents?.terms && consents?.privacy) {
      const existingUser = await CustomerUser.findOne({ tenantId, email: customerInput.email.toLowerCase() });

      if (existingUser) {
        const isMatch = await existingUser.comparePassword(password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Email уже зарегистрирован, но неверный пароль.' });
        }
        customerUserId = existingUser._id;
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new CustomerUser({
          email: customerInput.email.toLowerCase(),
          passwordHash: hashedPassword,
          name: customerInput.name,
          phone: customerInput.phone,
          tenantId,
          consents: {
            terms: consents.terms,
            privacy: consents.privacy,
            marketing: consents.marketing || false,
            acceptedAt: new Date()
          }
        });
        await newUser.save();
        customerUserId = newUser._id;
      }

      authToken = jwt.sign(
        { userId: customerUserId, tenantId, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
    }
    // ------------------------------

    // CRM Логика (Customer модель)
    let customer = await Customer.findOne({ tenantId, email: customerInput.email });
    if (!customer) {
      customer = new Customer({
        tenantId,
        email: customerInput.email,
        phone: customerInput.phone,
        name: customerInput.name,
        createdViaOrder: true,
      });
    } else {
      if (customerInput.name) customer.name = customerInput.name;
      if (customerInput.phone) customer.phone = customerInput.phone;
    }

    if (fulfillment?.type === 'delivery' && fulfillment.address) {
      const addr = fulfillment.address;
      const exists = customer.addresses.some(
        a => a.street === addr.street && a.city === addr.city && a.zip === addr.zip
      );
      if (!exists) {
        customer.addresses.push({
          label: addr.label || 'Дом',
          street: addr.street,
          city: addr.city,
          zip: addr.zip,
          coordinates: addr.coordinates || {},
          isDefault: customer.addresses.length === 0,
        });
      }
    }
    await customer.save();

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = fulfillment?.type === 'delivery' ? (fulfillment.deliveryFee || 0) : 0;
    const fees = calculateFees(subtotal, deliveryFee, tenant);

    const order = new Order({
      tenantId,
      branchId: branchId || null,
      customerId: customer._id,
      customerUserId: customerUserId, // Связь с Auth юзером
      fulfillment: {
        type: fulfillment?.type || 'pickup',
        scheduledFor: fulfillment?.scheduledFor || null,
        address: fulfillment?.type === 'delivery' ? fulfillment.address : undefined,
        deliveryInstructions: fulfillment?.deliveryInstructions || '',
        deliveryFee,
      },
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        basePrice: i.basePrice || 0, // <--- Добавили
        price: i.price,
        quantity: i.quantity,
        notes: i.notes || '',
        modifiers: i.modifiers || [], // <--- Добавили
      })),
      customer: {
        name: customerInput.name,
        phone: customerInput.phone,
        email: customerInput.email,
      },
      pricing: {
        currency: tenant.primaryCurrency || 'pln',
        ...fees,
      },
      locale,
    });

    await order.save();

    res.status(201).json({
      orderId: order._id,
      total: order.pricing.total,
      serviceFee: order.pricing.serviceFee,
      token: authToken,
    });
  } catch (err) {
    console.error('POST /api/orders/public error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Customer already exists with this email' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 3. ОПЛАТА (PaymentIntent) - ЭТО ТО, ЧТО НЕ РАБОТАЛО
// ==============================
router.post('/:id/pay', getTenant, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending_payment') return res.status(400).json({ error: 'Order is not awaiting payment' });

    const tenant = req.tenant;
    if (!tenant.payments?.stripeAccountId) {
      return res.status(400).json({ error: 'Restaurant is not connected to Stripe' });
    }

    const amountInGroszy = Math.round(order.pricing.total * 100);
    const applicationFeeGroszy = Math.round(order.pricing.serviceFee * 100);

    const paymentIntent = await Stripe.paymentIntents.create({
      amount: amountInGroszy,
      currency: order.pricing.currency,
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: tenant.payments.stripeAccountId,
      },
      application_fee_amount: applicationFeeGroszy,
      metadata: {
        orderId: order._id.toString(),
        tenantId: req.tenantId,
      },
    });

    order.payment.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('PaymentIntent error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;