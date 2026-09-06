const express = require('express');
const router = express.Router();
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');

/**
 * GET /api/stripe/invoices
 * Returns the customer's recent billing history from Stripe.
 * Auth: tenant admin (authTenant)
 */
router.get('/invoices', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const invoiceList = await Stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 12,
    });

    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id,
      date: inv.created * 1000, // Stripe returns unix timestamp in seconds
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status, // 'paid', 'open', 'void', 'uncollectible'
      description: inv.description || inv.lines?.data?.[0]?.description || null,
      pdfUrl: inv.invoice_pdf || null,
      hostedUrl: inv.hosted_invoice_url || null,
    }));

    res.json({ invoices });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
