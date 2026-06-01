const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

router.post('/create-checkout-session', authTenant, async (req, res) => {
  try {
    const { priceId } = req.body;

    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer не найден' });
    }

    // Если tenantId уже назначен — обновляем метадату в Stripe
    if (user.tenantId) {
      await Stripe.customers.update(user.stripeCustomerId, {
        metadata: { tenantId: user.tenantId, userId: user._id.toString() },
      });
    }

    const session = await Stripe.checkout.sessions.create({
      customer:  user.stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode:      'subscription',
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          userId:   user._id.toString(),
          tenantId: user.tenantId || '',
        },
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;