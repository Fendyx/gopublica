const express = require('express');
const router = express.Router();
const StaffMember = require('../../../models/tenant/StaffMember');

/**
 * GET /api/gopublica/tenants/staff?tenantId=&branchId=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const filter = { tenantId };
    if (branchId) filter.branchId = branchId;
    const staff = await StaffMember.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/staff?tenantId=
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const member = await StaffMember.create({ ...req.body, tenantId });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/staff/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const member = await StaffMember.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!member) return res.status(404).json({ error: 'StaffMember not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/staff/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const member = await StaffMember.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!member) return res.status(404).json({ error: 'StaffMember not found' });
    res.json({ message: 'StaffMember deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
