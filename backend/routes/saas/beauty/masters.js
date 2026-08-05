const express = require('express');
const router = express.Router();
const BeautyMaster = require('../../../models/beauty/Master');
const authTenant = require('../../../middleware/authTenant');
const checkBranch = require('../../../middleware/checkBranch');

router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
    const masters = await BeautyMaster.find(query).populate('services').sort({ name: 1 });
    res.json(masters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authTenant, checkBranch, async (req, res) => {
  try {
    const master = new BeautyMaster({
      tenantId: req.tenantId,
      branchId: req.body.branchId || req.branch?._id || null,
      ...req.body,
    });
    await master.save();
    res.status(201).json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authTenant, checkBranch, async (req, res) => {
  try {
    const master = await BeautyMaster.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!master) return res.status(404).json({ error: 'Master not found' });
    Object.assign(master, req.body);
    await master.save();
    res.json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authTenant, async (req, res) => {
  try {
    const master = await BeautyMaster.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!master) return res.status(404).json({ error: 'Master not found' });
    await BeautyMaster.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
