const express = require('express');
const router = express.Router();
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../../models/Order');
const authTenant = require('../../middleware/authTenant');
const checkBranch = require('../../middleware/checkBranch'); // опционально

router.use(authTenant);

// Получить список заказов
router.get('/', async (req, res) => {
  try {
    const { status, branchId, from, to } = req.query;
    const filter = { tenantId: req.tenantId };
    if (status) filter.status = status;
    if (branchId) filter.branchId = branchId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Детали заказа
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('customerId')
      .lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Подтвердить заказ (accept)
router.post('/:id/accept', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.confirmation.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    order.confirmation.status = 'accepted';
    order.confirmation.acceptedAt = new Date();
    order.status = 'accepted';
    await order.save();

    // Уведомление ресторану (заглушка)
    require('../../services/orderNotification').notifyOrderAccepted(order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отклонить заказ (decline) с возвратом денег
router.post('/:id/decline', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.confirmation.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    const { reason } = req.body;
    // Возврат средств, если был платёжный интент
    if (order.payment.paymentIntentId) {
      await Stripe.refunds.create({
        payment_intent: order.payment.paymentIntentId,
        reason: 'requested_by_customer',
      });
      order.payment.refundId = 'refund_manual'; // можно сохранить реальный ID
    }

    order.confirmation.status = 'declined';
    order.confirmation.declinedAt = new Date();
    order.confirmation.declineReason = reason || '';
    order.status = 'cancelled';
    await order.save();

    require('../../services/orderNotification').notifyOrderDeclined(order, reason);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Изменить статус приготовления
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['preparing', 'ready', 'out_for_delivery', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;