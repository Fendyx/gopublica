const express = require('express');
const router  = express.Router();
const Lead    = require('../models/lead');
const auth    = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const ADMIN_ROLES = ['admin', 'superadmin'];

const canEdit = (user, lead) => {
  if (user.role === 'superadmin') return true;
  return lead.assignedTo?.toString() === user.id;
};

// GET /api/leads — все лиды
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const leads = await Lead.find({})
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching leads', error: err.message });
  }
});

// POST /api/leads — создать лид
router.post('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const {
      name, phone, source, comment,
      city, businessHours,
      price, businessType, servicesRequested,
      priority, followUpAt,
      assignedTo,
    } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const lead = await Lead.create({
      name:    name.trim(),
      phone:   phone.trim(),
      source:  source?.trim()  || '',
      comment: comment?.trim() || '',
      city:    city?.trim()    || '',
      businessHours: businessHours?.trim() || '',
      price:   Number(price)   || 0,
      businessType: businessType || 'Other',
      servicesRequested: Array.isArray(servicesRequested) ? servicesRequested : [],
      priority:   priority   || 'Medium',
      followUpAt: followUpAt || null,
      createdBy:  req.user.id,
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
router.put('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (!canEdit(req.user, lead)) {
      return res.status(403).json({ message: 'You can only edit leads assigned to you' });
    }

    const {
      status, priority, assignedTo, comment, followUpAt,
      name, phone, source, price, businessType, servicesRequested,
      city, businessHours,
    } = req.body;

    const update = {};
    if (status             !== undefined) update.status             = status;
    if (priority           !== undefined) update.priority           = priority;
    if (comment            !== undefined) update.comment            = comment;
    if (followUpAt         !== undefined) update.followUpAt         = followUpAt;
    if (name               !== undefined) update.name               = name.trim();
    if (phone              !== undefined) update.phone              = phone.trim();
    if (source             !== undefined) update.source             = source?.trim() ?? '';
    if (price              !== undefined) update.price              = Number(price) || 0;
    if (businessType       !== undefined) update.businessType       = businessType;
    if (servicesRequested  !== undefined) update.servicesRequested  = servicesRequested;
    if (city               !== undefined) update.city               = city?.trim() ?? '';
    if (businessHours      !== undefined) update.businessHours      = businessHours?.trim() ?? '';

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

router.post('/import', auth, async (req, res) => {
  try {
    const rawLeads = req.body; // ожидаем массив объектов формата Apify
    if (!Array.isArray(rawLeads)) {
      return res.status(400).json({ message: 'Body must be an array' });
    }

    const userId = req.user._id; // предполагаю, что auth middleware добавляет user в req
    const toInsert = [];
    const skipped = [];

    for (const item of rawLeads) {
      // Поиск дубликата по телефону (если есть) или по url
      let existing = null;
      if (item.phone) {
        existing = await Lead.findOne({ phone: item.phone });
      }
      if (!existing && item.url) {
        existing = await Lead.findOne({ source: item.url });
      }
      if (existing) {
        skipped.push({ title: item.title, reason: 'Duplicate phone or URL' });
        continue;
      }

      // Маппинг
      const newLead = {
        name: item.title,
        phone: item.phone || '',
        source: item.url || '',
        city: item.city || '',
        businessType: item.categoryName || 'Other',
        servicesRequested: item.categories || [],
        // Дополнительные поля, если добавил в модель:
        // rating: item.totalScore,
        // reviewsCount: item.reviewsCount,
        // street: item.street,
        // state: item.state,
        // country: item.countryCode,
        comment: `Imported from Apify. Rating: ${item.totalScore}, reviews: ${item.reviewsCount}`,
        status: 'New',
        price: 0,
        priority: 'Medium',
        createdBy: userId,
        assignedTo: null,
        businessHours: '',
      };
      toInsert.push(newLead);
    }

    if (toInsert.length > 0) {
      await Lead.insertMany(toInsert);
    }

    res.json({
      inserted: toInsert.length,
      skipped: skipped.length,
      skippedDetails: skipped,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;