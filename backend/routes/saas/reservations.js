const express = require('express');
const router = express.Router();
const Reservation = require('../../models/Reservation');
const authTenant = require('../../middleware/authTenant');

// Публичный: создание брони
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId обязателен' });

    const { name, phone, email, date, time, guests, comment } = req.body;
    const reservation = new Reservation({
      tenantId,
      name,
      phone,
      email,
      date,
      time,
      guests,
      comment,
    });
    await reservation.save();
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: список броней (для админа ресторана)
router.get('/', authTenant, async (req, res) => {
  try {
    const reservations = await Reservation.find({ tenantId: req.tenantId })
      .sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: изменение статуса (подтвердить/отклонить)
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

// Удаление бронирования (защищённый)
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