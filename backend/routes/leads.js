const express = require('express');
const router  = express.Router();
const Lead    = require('../models/lead');
const auth    = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const ADMIN_ROLES = ['admin', 'superadmin'];

// Хелпер: проверяем может ли юзер редактировать этот лид
const canEdit = (user, lead) => {
  if (user.role === 'superadmin') return true;
  return lead.assignedTo?.toString() === user.id;
};

// GET /api/leads — все лиды
// superadmin видит всё, admin видит только свои
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin'
      ? {}
      : { assignedTo: req.user.id };

    const leads = await Lead.find(filter)
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching leads', error: err.message });
  }
});

// POST /api/leads — создать лид
// assignedTo по умолчанию = текущий юзер
router.post('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const {
      name, phone, source, comment,
      price, businessType, servicesRequested,
      priority, followUpAt,
      assignedTo, // может переназначить вручную
    } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const lead = await Lead.create({
      name:    name.trim(),
      phone:   phone.trim(),
      source:  source?.trim()  || '',
      comment: comment?.trim() || '',
      price:   Number(price)   || 0,
      businessType: businessType || 'Other',
      servicesRequested: Array.isArray(servicesRequested) ? servicesRequested : [],
      priority:   priority   || 'Medium',
      followUpAt: followUpAt || null,
      createdBy:  req.user.id,
      // Если передали assignedTo — берём его, иначе назначаем себе
      assignedTo: assignedTo || req.user.id,
    });

    await lead.populate('createdBy',  'name email');
    await lead.populate('assignedTo', 'name email');

    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ message: 'Error creating lead', error: err.message });
  }
});

// PUT /api/leads/:id — обновить лид
// Только assignedTo или superadmin
router.put('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (!canEdit(req.user, lead)) {
      return res.status(403).json({ message: 'You can only edit leads assigned to you' });
    }

    const {
      status, priority, assignedTo,
      comment, followUpAt,
    } = req.body;

    // Whitelist — только эти поля можно обновить
    const update = {};
    if (status     !== undefined) update.status     = status;
    if (priority   !== undefined) update.priority   = priority;
    if (comment    !== undefined) update.comment    = comment;
    if (followUpAt !== undefined) update.followUpAt = followUpAt;

    // Переназначить может только superadmin
    if (assignedTo !== undefined && req.user.role === 'superadmin') {
      update.assignedTo = assignedTo;
    }

    const updated = await Lead.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    )
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating lead', error: err.message });
  }
});

// DELETE /api/leads/:id
// Только assignedTo или superadmin
router.delete('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (!canEdit(req.user, lead)) {
      return res.status(403).json({ message: 'You can only delete leads assigned to you' });
    }

    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting lead', error: err.message });
  }
});

module.exports = router;