const express     = require('express');
const router      = express.Router();
const Client      = require('../models/client');
const Subscription = require('../models/subscription');
const ChangeRequest = require('../models/changeRequest');
const convertLead = require('../services/convertLead');
const auth        = require('../middleware/auth');
const checkRole   = require('../middleware/checkRole');

const ADMIN = ['admin', 'superadmin'];

// GET /api/clients — все клиенты
router.get('/', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const clients = await Client.find({ status: { $ne: 'churned' } })
      .sort({ createdAt: -1 });

    // Подтягиваем подписку для каждого клиента
    const clientsWithSubs = await Promise.all(
      clients.map(async (c) => {
        const sub = await Subscription.findOne({ clientId: c._id });
        return { ...c.toObject(), subscription: sub };
      })
    );

    res.json(clientsWithSubs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching clients', error: err.message });
  }
});

// GET /api/clients/:id — один клиент со всеми данными
router.get('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const subscription = await Subscription.findOne({ clientId: client._id });
    const changeRequests = await ChangeRequest.find({ clientId: client._id })
      .sort({ createdAt: -1 });

    res.json({ ...client.toObject(), subscription, changeRequests });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching client', error: err.message });
  }
});

// POST /api/leads/:id/convert — конвертация лида в клиента
router.post('/convert/:leadId', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { email, country, websiteUrl, plan, amount } = req.body;

    const result = await convertLead(req.params.leadId, {
      email, country, websiteUrl, plan, amount,
    });

    res.status(201).json(result);
  } catch (err) {
    const status = err.message.includes('not found') ? 404
                 : err.message.includes('already')   ? 400
                 : 500;
    res.status(status).json({ message: err.message });
  }
});

// PUT /api/clients/:id — обновить клиента
router.put('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { name, phone, email, country, businessType, websiteUrl, assignedTo, notes, status } = req.body;

    const update = {};
    if (name         !== undefined) update.name         = name;
    if (phone        !== undefined) update.phone        = phone;
    if (email        !== undefined) update.email        = email;
    if (country      !== undefined) update.country      = country;
    if (businessType !== undefined) update.businessType = businessType;
    if (websiteUrl   !== undefined) update.websiteUrl   = websiteUrl;
    if (assignedTo   !== undefined) update.assignedTo   = assignedTo;
    if (notes        !== undefined) update.notes        = notes;
    if (status       !== undefined) update.status       = status;

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