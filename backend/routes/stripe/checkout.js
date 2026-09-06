const express    = require('express');
const router     = express.Router();
const { updateCustomer, createCheckoutSession, ensureValidCustomer } = require('../../services/payments/stripe');
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');

router.post('/create-checkout-session', authTenant, async (req, res) => {
  try {
    const { priceId, currency } = req.body;

    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer не найден' });
    }

    // Verify the Stripe customer still exists; if deleted, auto-create a new one
    const { customer: stripeCustomer, isNew } = await ensureValidCustomer(user.stripeCustomerId, user);
    if (isNew) {
      user.stripeCustomerId = stripeCustomer.id;
      await user.save();
    }
    const customerId = stripeCustomer.id;

    // Если tenantId уже назначен — обновляем метадату в Stripe
    if (user.tenantId) {
      await updateCustomer(customerId, {
        metadata: { tenantId: user.tenantId, userId: user._id.toString() },
      });
    }

    const session = await createCheckoutSession({
      customer: customerId,
      priceId,
      userId: user._id.toString(),
      tenantId: user.tenantId,
      currency,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;