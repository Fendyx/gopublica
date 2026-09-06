const express = require('express');
const router = express.Router();
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');

/**
 * Helper: extract card details from a Stripe PaymentMethod object.
 */
function extractCardDetails(pm, userName) {
  return {
    brand: pm.card?.brand || null,
    last4: pm.card?.last4 || null,
    expMonth: pm.card?.exp_month || null,
    expYear: pm.card?.exp_year || null,
    cardholderName: pm.billing_details?.name || userName || null,
  };
}

/**
 * GET /api/stripe/payment-method
 * Returns the customer's default payment method details from Stripe.
 * 3-tier fallback:
 *   1. Customer-level invoice_settings.default_payment_method
 *   2. Most recent attached card via paymentMethods.list()
 *   3. Active subscription's default_payment_method
 * Auth: tenant admin (authTenant)
 */
router.get('/payment-method', authTenant, async (req, res) => {
  const EMPTY = { brand: null, last4: null, expMonth: null, expYear: null, cardholderName: null };
  try {
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripeCustomerId) {
      return res.json(EMPTY);
    }

    const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // ── Tier 1: Customer-level default payment method ──
    const customer = await Stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    });

    const pm = customer.invoice_settings?.default_payment_method;
    if (pm && typeof pm === 'object' && pm.card) {
      return res.json(extractCardDetails(pm, user.name));
    }

    // ── Tier 2: List most recent attached card ──
    const list = await Stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
      limit: 1,
    });

    if (list.data.length > 0) {
      return res.json(extractCardDetails(list.data[0], user.name));
    }

    // ── Tier 3: Active subscription's default payment method ──
    const subs = await Stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subs.data.length > 0) {
      const subPmId = subs.data[0].default_payment_method;
      if (subPmId && typeof subPmId === 'string') {
        const subPm = await Stripe.paymentMethods.retrieve(subPmId);
        if (subPm && subPm.card) {
          return res.json(extractCardDetails(subPm, user.name));
        }
      } else if (subPmId && typeof subPmId === 'object' && subPmId.card) {
        return res.json(extractCardDetails(subPmId, user.name));
      }
    }

    return res.json(EMPTY);
  } catch (err) {
    console.error('Get payment method error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
