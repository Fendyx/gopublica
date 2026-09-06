const express = require('express');
const router = express.Router();
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');

/**
 * GET /api/stripe/payment-method
 * Returns the customer's default payment method details from Stripe.
 * Auth: tenant admin (authTenant)
 */
router.get('/payment-method', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripeCustomerId) {
      return res.json({ brand: null, last4: null, expMonth: null, expYear: null, cardholderName: null });
    }

    const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Retrieve the customer to find the default payment method
    const customer = await Stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    });

    const pm = customer.invoice_settings?.default_payment_method;

    // If no default, try listing the most recent card
    if (!pm || typeof pm === 'string') {
      const list = await Stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
        limit: 1,
      });

      if (list.data.length === 0) {
        return res.json({ brand: null, last4: null, expMonth: null, expYear: null, cardholderName: null });
      }

      const card = list.data[0];
      return res.json({
        brand: card.card.brand,
        last4: card.card.last4,
        expMonth: card.card.exp_month,
        expYear: card.card.exp_year,
        cardholderName: card.billing_details?.name || user.name || null,
      });
    }

    // Payment method was expanded
    return res.json({
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      cardholderName: pm.billing_details?.name || user.name || null,
    });
  } catch (err) {
    console.error('Get payment method error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
