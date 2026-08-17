const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const webpush = require('web-push');
const Reservation = require('../../models/Reservation');
const Branch = require('../../models/Branch');
const PushSubscription = require('../../models/PushSubscription');
const authTenant = require('../../middleware/authTenant');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// Публичный: создание брони (теперь с branchId или branchSlug)
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId обязателен' });

    const { branchId, branchSlug, name, phone, email, date, time, guests, comment } = req.body;

    let resolvedBranchId = branchId;

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId });
      if (!branch) return res.status(403).json({ error: 'Филиал не найден или не принадлежит тенанту' });
      resolvedBranchId = branch._id;
    }

    if (!resolvedBranchId) return res.status(400).json({ error: 'branchId или branchSlug обязателен' });

    // Проверяем, что филиал принадлежит этому тенанту
    const branch = await Branch.findOne({ _id: resolvedBranchId, tenantId });
    if (!branch) return res.status(403).json({ error: 'Филиал не найден или не принадлежит тенанту' });

    const reservation = new Reservation({
      tenantId,
      branchId: resolvedBranchId,
      name,
      phone,
      email,
      date,
      time,
      guests,
      comment,
    });
    await reservation.save();

    // Push-уведомления (без изменений, можно при желании добавить branchId в payload)
    const subs = await PushSubscription.find({ tenantId });
    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: '🍽️ Neue Buchung',
        body: `${name} · ${date} um ${time}${guests ? ` · ${guests} Gäste` : ''} · ${branch.city} ${branch.name}`,
        tag: `booking-${reservation._id}`,
        url: '/admin/reservations',
      });

      const results = await Promise.allSettled(
        subs.map(sub => webpush.sendNotification(sub.subscription, payload))
      );

      const expiredEndpoints = results
        .map((r, i) => ({ r, sub: subs[i] }))
        .filter(({ r }) => r.status === 'rejected' && r.reason?.statusCode === 410)
        .map(({ sub }) => sub.endpoint);

      if (expiredEndpoints.length > 0) {
        await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
      }
    }

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: список броней (с фильтром по branchId или branchSlug)
router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId, branchSlug } = req.query;
    const query = { tenantId: req.tenantId };

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found for slug' });
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }

    if (resolvedBranchId) query.branchId = resolvedBranchId;
    const reservations = await Reservation.find(query).sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Изменение статуса
router.patch('/:id', authTenant, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Не найдено' });
    if (reservation.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });
    reservation.status = req.body.status;
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Не найдено' });
    if (reservation.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;