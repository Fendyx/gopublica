const express = require('express');
const router = express.Router();
const BeautyService = require('../../../models/beauty/ServiceItem');
const authTenant = require('../../../middleware/authTenant');
const checkBranch = require('../../../middleware/checkBranch');

router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
    const services = await BeautyService.find(query).sort({ sortOrder: 1, createdAt: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authTenant, checkBranch, async (req, res) => {
  try {
    const service = new BeautyService({
      tenantId: req.tenantId,
      branchId: req.body.branchId || req.branch?._id || null,
      ...req.body,
    });
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authTenant, checkBranch, async (req, res) => {
  try {
    const service = await BeautyService.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    Object.assign(service, req.body);
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authTenant, async (req, res) => {
  try {
    const service = await BeautyService.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await BeautyService.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
