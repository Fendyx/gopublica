const express = require('express');
const router = express.Router();
const MenuItem = require('../../models/MenuItem');
const Reservation = require('../../models/Reservation');
const authTenant = require('../../middleware/authTenant');

router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Количество блюд
    const menuCount = await MenuItem.countDocuments({ tenantId });

    // Сегодняшняя дата в формате YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    // Бронирования за сегодня
    const todayReservations = await Reservation.find({
      tenantId,
      date: today,
    }).sort({ time: 1 });

    // Всего бронирований
    const totalReservations = await Reservation.countDocuments({ tenantId });

    res.json({
      menuCount,
      todayReservationsCount: todayReservations.length,
      totalReservationsCount: totalReservations,
      lastReservations: todayReservations.slice(0, 5), // последние 5 на сегодня
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;