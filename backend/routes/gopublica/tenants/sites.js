const express = require('express');
const router = express.Router();
const Site = require('../../../models/Site');

/**
 * GET /api/gopublica/tenants/sites?tenantId=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const sites = await Site.find({ tenantId }).sort({ createdAt: -1 }).lean();
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/sites/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
