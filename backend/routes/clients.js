const express   = require('express');
const router    = express.Router();
const Client    = require('../models/client');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const ADMIN = ['admin', 'superadmin'];

// GET /api/clients — все клиенты
router.get('/', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const clients = await Client.find({ status: { $ne: 'churned' } })
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching clients', error: err.message });
  }
});

// POST /api/clients — создать клиента
router.post('/', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || '',
      country: req.body.country || '',
      businessType: req.body.businessType || 'Other',
      websiteUrl: req.body.websiteUrl || '',
      source: req.body.source || '',
      assignedTo: req.body.assignedTo || '',
      status: req.body.status || 'active',
      notes: req.body.notes || '',
    };

    if (!payload.name || !payload.phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const created = await Client.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: 'Error creating client', error: err.message });
  }
});

// GET /api/clients/:id — один клиент
router.get('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching client', error: err.message });
  }
});

// PUT /api/clients/:id — обновить клиента
router.put('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { name, phone, email, country, assignedTo, notes, status } = req.body;

    const update = {};
    if (name       !== undefined) update.name       = name;
    if (phone      !== undefined) update.phone      = phone;
    if (email      !== undefined) update.email      = email;
    if (country    !== undefined) update.country    = country;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (notes      !== undefined) update.notes      = notes;
    if (status     !== undefined) update.status     = status;

    const updated = await Client.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Client not found' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating client', error: err.message });
  }
});

// DELETE /api/clients/:id — архивировать (не удалять физически)
router.delete('/:id', auth, checkRole(['superadmin']), async (req, res) => {
  try {
    const updated = await Client.findByIdAndUpdate(
      req.params.id,
      { status: 'churned' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client archived', client: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error archiving client', error: err.message });
  }
});

module.exports = router;