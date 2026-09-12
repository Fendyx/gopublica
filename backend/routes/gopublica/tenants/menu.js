const express = require('express');
const router = express.Router();
const MenuItem = require('../../../models/food/MenuItem');

/**
 * GET /api/gopublica/tenants/menu?tenantId=&branchId=&categoryKey=&status=&page=&limit=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId, categoryKey, status, page = '1', limit = '50' } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const filter = { tenantId };
    if (branchId) filter.branchId = branchId;
    if (categoryKey) filter.categoryKey = categoryKey;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      MenuItem.find(filter).sort({ categoryKey: 1, order: 1 }).skip(skip).limit(limitNum).lean(),
      MenuItem.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gopublica/tenants/menu/:id?tenantId=
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const item = await MenuItem.findOne({ _id: req.params.id, tenantId }).lean();
    if (!item) return res.status(404).json({ error: 'MenuItem not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/menu?tenantId=
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const item = await MenuItem.create({ ...req.body, tenantId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/menu/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!item) return res.status(404).json({ error: 'MenuItem not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/menu/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!item) return res.status(404).json({ error: 'MenuItem not found' });
    res.json({ message: 'MenuItem deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
