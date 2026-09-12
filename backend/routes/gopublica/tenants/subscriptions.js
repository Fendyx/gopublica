const express = require('express');
const router = express.Router();
const Subscription = require('../../../models/payments/Subscription');

/**
 * GET /api/gopublica/tenants/subscriptions?tenantId=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const sub = await Subscription.findOne({ tenantId }).lean();
    if (!sub) return res.json(null);
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/subscriptions/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const { plan, amount, status, nextBillingDate, includes } = req.body;
    const update = {};
    if (plan !== undefined) update.plan = plan;
    if (amount !== undefined) update.amount = amount;
    if (status !== undefined) update.status = status;
    if (nextBillingDate !== undefined) update.nextBillingDate = nextBillingDate;
    if (includes !== undefined) update.includes = includes;

    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      update,
      { new: true, runValidators: true },
    );
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
