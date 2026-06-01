const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

router.post('/setup-intent', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer не найден' });
    }

    const setupIntent = await Stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      usage: 'off_session', // чтобы можно было списывать позже
      metadata: {
        userId: user._id.toString(),
      },
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;