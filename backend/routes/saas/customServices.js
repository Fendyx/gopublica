const express = require('express');
const router = express.Router();
const CustomService = require('../../models/tenant/CustomService');
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');
const { Stripe } = require('../../services/payments/stripe');

// GET /api/saas/custom-services — list tenant's custom services
router.get('/', authTenant, async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Optionally filter to billable only (price > 0)
    if (req.query.billable === 'true') {
      filter.price = { $gt: 0 };
    }

    const services = await CustomService.find(filter).sort({ createdAt: -1 });

    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching custom services', details: err.message });
  }
});

// GET /api/saas/custom-services/:id — get single item
router.get('/:id', authTenant, async (req, res) => {
  try {
    const service = await CustomService.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!service) {
      return res.status(404).json({ error: 'Custom service not found' });
    }

    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching custom service', details: err.message });
  }
});

// POST /api/saas/custom-services/:id/pay — create Stripe PaymentIntent
router.post('/:id/pay', authTenant, async (req, res) => {
  try {
    const service = await CustomService.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!service) {
      return res.status(404).json({ error: 'Custom service not found' });
    }

    if (service.price <= 0) {
      return res.status(400).json({ error: 'This service is included in your subscription' });
    }

    if (service.status === 'completed' || service.status === 'cancelled') {
      return res.status(400).json({ error: 'This service cannot be paid for' });
    }

    if (service.paymentIntentId) {
      // Payment already initiated — retrieve existing intent
      const existingIntent = await Stripe.paymentIntents.retrieve(service.paymentIntentId);
      if (existingIntent.status === 'succeeded') {
        return res.status(400).json({ error: 'Payment already completed' });
      }
      // Return existing client_secret for retry
      return res.json({
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
      });
    }

    // Look up tenant's Stripe customer
    const user = await TenantUser.findOne({ tenantId: req.tenantId });
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({
        error: 'No payment method on file. Please set up billing first.',
      });
    }

    // Create PaymentIntent
    const amountInGroszy = Math.round(service.price * 100); // Convert to smallest unit

    const paymentIntent = await Stripe.paymentIntents.create({
      amount: amountInGroszy,
      currency: service.currency,
      automatic_payment_methods: { enabled: true },
      customer: user.stripeCustomerId,
      metadata: {
        customServiceId: service._id.toString(),
        tenantId: req.tenantId,
      },
    });

    // Update service with payment intent and optimistic status
    service.paymentIntentId = paymentIntent.id;
    if (service.status === 'pending') {
      service.status = 'in_progress';
    }
    await service.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating payment', details: err.message });
  }
});

module.exports = router;
