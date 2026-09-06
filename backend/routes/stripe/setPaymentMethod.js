const express = require('express');
const router = express.Router();
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');

/**
 * POST /api/stripe/set-payment-method
 * Attaches a payment method to the customer and sets it as the default.
 * Used by the billing modal when adding or updating a card.
 * Auth: tenant admin (authTenant)
 */
router.post('/set-payment-method', authTenant, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'paymentMethodId is required' });
    }

    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    // Attach the payment method to the customer (idempotent if already attached)
    await Stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as the customer's default payment method
    await Stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Retrieve the PM to return its details
    const pm = await Stripe.paymentMethods.retrieve(paymentMethodId);

    res.json({
      brand: pm.card?.brand || null,
      last4: pm.card?.last4 || null,
      expMonth: pm.card?.exp_month || null,
      expYear: pm.card?.exp_year || null,
      cardholderName: pm.billing_details?.name || user.name || null,
    });
  } catch (err) {
    console.error('Set payment method error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
