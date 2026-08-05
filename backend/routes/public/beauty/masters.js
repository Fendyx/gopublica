const express = require('express');
const router = express.Router();
const BeautyMaster = require('../../../models/beauty/Master');

router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId, serviceId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const query = { tenantId, isActive: true };
    if (branchId) query.branchId = branchId;
    if (serviceId) query.services = serviceId;

    const masters = await BeautyMaster.find(query).populate('services', 'name price durationMinutes').sort({ name: 1 });
    res.json(masters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
