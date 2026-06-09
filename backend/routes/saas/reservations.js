const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Reservation = require('../../models/Reservation');
const Branch = require('../../models/Branch');
const PushSubscription = require('../../models/PushSubscription');
const authTenant = require('../../middleware/authTenant');

// Публичный: создание брони (теперь с branchId)
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId обязателен' });

    const { branchId, name, phone, email, date, time, guests, comment } = req.body;
    if (!branchId) return res.status(400).json({ error: 'branchId обязателен' });

    // Проверяем, что филиал принадлежит этому тенанту
    const branch = await Branch.findOne({ _id: branchId, tenantId });
    if (!branch) return res.status(403).json({ error: 'Филиал не найден или не принадлежит тенанту' });

    const reservation = new Reservation({
      tenantId,
      branchId,
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

// Защищённый: список броней (с фильтром по branchId)
router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
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