const express = require('express');
const router = express.Router();
const CustomService = require('../../models/tenant/CustomService');
const auth = require('../../middleware/auth/jwt');
const checkRole = require('../../middleware/auth/role');

const ADMIN_ROLES = ['admin', 'superadmin'];

// GET /api/custom-services - list all (admin, supports ?tenantId filter)
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const filter = {};
    if (req.query.tenantId) filter.tenantId = req.query.tenantId;
    if (req.query.status) filter.status = req.query.status;

    const services = await CustomService.find(filter).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching custom services', details: err.message });
  }
});

// GET /api/custom-services/:id - get single item
router.get('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const service = await CustomService.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Custom service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching custom service', details: err.message });
  }
});

// POST /api/custom-services - create a new custom service for a tenant
router.post('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { tenantId, title, description, price, currency, priority, notes } = req.body;

    if (!tenantId?.trim() || !title?.trim()) {
      return res.status(400).json({ error: 'tenantId and title are required' });
    }
    if (price !== undefined && price < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    const service = await CustomService.create({
      tenantId: tenantId.trim(),
      title: title.trim(),
      description: description?.trim() || '',
      price: Number(price) || 0,
      currency: currency?.trim() || 'pln',
      priority: priority || 'medium',
      notes: notes?.trim() || '',
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: 'Error creating custom service', details: err.message });
  }
});

// PUT /api/custom-services/:id - update a custom service
router.put('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { title, description, price, currency, status, priority, notes } = req.body;

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (price !== undefined) update.price = Number(price);
    if (currency !== undefined) update.currency = currency.trim();
    if (status !== undefined) update.status = status;
    if (priority !== undefined) update.priority = priority;
    if (notes !== undefined) update.notes = notes.trim();

    // Track completion time
    if (status === 'completed') update.completedAt = new Date();
    if (status === 'cancelled') update.completedAt = null;

    const service = await CustomService.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ error: 'Custom service not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ error: 'Error updating custom service', details: err.message });
  }
});

// DELETE /api/custom-services/:id - delete a custom service
router.delete('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const service = await CustomService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Custom service not found' });
    res.json({ message: 'Custom service deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting custom service', details: err.message });
  }
});

module.exports = router;
