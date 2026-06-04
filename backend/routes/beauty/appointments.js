const express = require('express');
const router = express.Router();
const BeautyAppointment = require('../../models/beauty/Appointment');
const authTenant = require('../../middleware/authTenant');

// Публичный: создание записи
router.post('/', async (req, res) => {
  try {
    const { tenantId, name, phone, email, date, time, guests, comment, serviceId } = req.body;
    const appointment = new BeautyAppointment({ tenantId, name, phone, email, date, time, guests, comment, serviceId });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: список записей
router.get('/', authTenant, async (req, res) => {
  try {
    const items = await BeautyAppointment.find({ tenantId: req.tenantId }).sort({ date: 1, time: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: изменение статуса
router.patch('/:id', authTenant, async (req, res) => {
  try {
    const appointment = await BeautyAppointment.findById(req.params.id);
    if (!appointment || appointment.tenantId !== req.tenantId) return res.status(404).json({ error: 'Not found' });
    appointment.status = req.body.status;
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: удаление
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const appointment = await BeautyAppointment.findById(req.params.id);
    if (!appointment || appointment.tenantId !== req.tenantId) return res.status(404).json({ error: 'Not found' });
    await BeautyAppointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;