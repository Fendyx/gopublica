const express = require('express');
const router = express.Router();
const GalleryItem = require('../../../models/content/GalleryItem');

/**
 * GET /api/gopublica/tenants/gallery?tenantId=&branchId=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const filter = { tenantId };
    if (branchId) filter.branchId = branchId;
    const items = await GalleryItem.find(filter).sort({ order: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/gallery?tenantId=
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const item = await GalleryItem.create({ ...req.body, tenantId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/gallery/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const item = await GalleryItem.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!item) return res.status(404).json({ error: 'GalleryItem not found' });
    res.json({ message: 'GalleryItem deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
