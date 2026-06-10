const express = require('express');
const router = express.Router();
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

router.post('/cancel-subscription', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    // Отменяем по окончании текущего оплаченного периода
    await Stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Обновим локально (вебхук потом тоже обновит статус)
    user.subscriptionStatus = 'canceled'; // или оставить 'active' до конца периода?
    // При cancel_at_period_end статус в Stripe остаётся 'active' до даты окончания, 
    // но в нашей логике можем сразу пометить, что отмена запланирована.
    // Для простоты поставим 'canceled', но аккуратно.
    await user.save();

    res.json({ subscriptionStatus: user.subscriptionStatus });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;