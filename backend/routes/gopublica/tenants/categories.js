const express = require('express');
const router = express.Router();
const CategoryTranslation = require('../../../models/food/CategoryTranslation');

/**
 * GET /api/gopublica/tenants/categories?tenantId=&niche=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, niche } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const filter = { tenantId };
    if (niche) filter.niche = niche;
    const categories = await CategoryTranslation.find(filter).sort({ order: 1, name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/categories?tenantId=
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const category = await CategoryTranslation.create({ ...req.body, tenantId });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/categories/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const category = await CategoryTranslation.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/categories/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const category = await CategoryTranslation.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
