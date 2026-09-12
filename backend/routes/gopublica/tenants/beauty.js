const express = require('express');
const router = express.Router();
const BeautyService = require('../../../models/beauty/ServiceItem');
const BeautyMaster = require('../../../models/beauty/Master');

/**
 * GET /api/gopublica/tenants/beauty/services?tenantId=&branchId=
 */
router.get('/services', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const filter = { tenantId };
    if (branchId) filter.branchId = branchId;
    const services = await BeautyService.find(filter).sort({ categoryKey: 1, name: 1 }).lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/beauty/services?tenantId=
 */
router.post('/services', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const service = await BeautyService.create({ ...req.body, tenantId });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/beauty/services/:id?tenantId=
 */
router.put('/services/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const service = await BeautyService.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/beauty/services/:id?tenantId=
 */
router.delete('/services/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const service = await BeautyService.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gopublica/tenants/beauty/masters?tenantId=&branchId=
 */
router.get('/masters', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const filter = { tenantId };
    if (branchId) filter.branchId = branchId;
    const masters = await BeautyMaster.find(filter).sort({ name: 1 }).lean();
    res.json(masters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/beauty/masters?tenantId=
 */
router.post('/masters', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const master = await BeautyMaster.create({ ...req.body, tenantId });
    res.status(201).json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/beauty/masters/:id?tenantId=
 */
router.put('/masters/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const master = await BeautyMaster.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!master) return res.status(404).json({ error: 'Master not found' });
    res.json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/beauty/masters/:id?tenantId=
 */
router.delete('/masters/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const master = await BeautyMaster.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!master) return res.status(404).json({ error: 'Master not found' });
    res.json({ message: 'Master deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
