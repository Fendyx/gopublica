const express      = require('express');
const router       = express.Router();
const Subscription = require('../models/subscription');
const auth         = require('../middleware/auth');
const checkRole    = require('../middleware/checkRole');

const ADMIN = ['admin', 'superadmin'];

// GET /api/subscriptions/:clientId — подписка клиента
router.get('/:clientId', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const sub = await Subscription.findOne({ clientId: req.params.clientId });
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subscription', error: err.message });
  }
});

// PUT /api/subscriptions/:id — изменить тариф / паузу / отмену
router.put('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { plan, amount, status, nextBillingDate, includes } = req.body;

    const update = {};
    if (plan            !== undefined) update.plan            = plan;
    if (amount          !== undefined) update.amount          = amount;
    if (status          !== undefined) update.status          = status;
    if (nextBillingDate !== undefined) update.nextBillingDate = nextBillingDate;
    if (includes        !== undefined) update.includes        = includes;

    const updated = await Subscription.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Subscription not found' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating subscription', error: err.message });
  }
});

// POST /api/subscriptions/:id/payment — записать платёж вручную
router.post('/:id/payment', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { amount, note, paidBy } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Добавляем платёж в историю + обновляем nextBillingDate на +1 месяц
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    sub.paymentHistory.push({ amount, note: note || '', paidBy: paidBy || '' });

    // Следующий платёж через месяц от текущего nextBillingDate
    const next = new Date(sub.nextBillingDate);
    next.setMonth(next.getMonth() + 1);
    sub.nextBillingDate = next;

    await sub.save();
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Error logging payment', error: err.message });
  }
});

module.exports = router;