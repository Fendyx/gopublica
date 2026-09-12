const express = require('express');
const router = express.Router();
const Customer = require('../../../models/Customer');

/**
 * GET /api/gopublica/tenants/customers?tenantId=&page=&limit=&q=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, q, page = '1', limit = '50' } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const filter = { tenantId };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({ customers, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gopublica/tenants/customers/:id?tenantId=
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const customer = await Customer.findOne({ _id: req.params.id, tenantId }).lean();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
