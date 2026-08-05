const express = require('express');
const router = express.Router();
const BeautyService = require('../../../models/beauty/ServiceItem');

router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const query = { tenantId, isActive: true };
    if (branchId) query.branchId = branchId;

    const services = await BeautyService.find(query).sort({ sortOrder: 1, createdAt: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
