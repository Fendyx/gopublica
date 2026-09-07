const express = require('express');
const router = express.Router();
const DemoRequest = require('../../models/sales/DemoRequest');
const auth = require('../../middleware/auth/jwt');
const checkRole = require('../../middleware/auth/role');

const ADMIN_ROLES = ['admin', 'superadmin'];

// GET /api/demo-requests - list all demo requests (admin only)
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await DemoRequest.find(filter)
      .sort({ createdAt: -limit })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const total = await DemoRequest.countDocuments(filter);

    res.json({ requests, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/demo-requests/:id - get single demo request
router.get('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const request = await DemoRequest.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ error: 'Demo request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/demo-requests/:id - update status (e.g., contact → done)
router.patch('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;

    const request = await DemoRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!request) return res.status(404).json({ error: 'Demo request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;