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

// GET /api/beauty/appointments/slots?tenantId=...&date=...&masterId=...&serviceIds=...
router.get('/slots', async (req, res) => {
  try {
    const { tenantId, date, masterId, serviceIds } = req.query;
    if (!tenantId || !date) return res.status(400).json({ error: 'tenantId and date required' });

    // Получаем услуги для расчёта суммарной длительности
    let totalDuration = 0;
    if (serviceIds) {
      const Service = require('../../models/beauty/ServiceItem');
      const services = await Service.find({ _id: { $in: serviceIds.split(',') }, tenantId });
      totalDuration = services.reduce((sum, s) => sum + (s.duration || 30), 0);
    }

    // Определяем рабочие часы (если мастер выбран, используем его, иначе общий диапазон)
    let startHour = 9, endHour = 23; // <-- изменили 18 на 21
    if (masterId) {
      const Master = require('../../models/beauty/Master');
      const master = await Master.findOne({ _id: masterId, tenantId });
      if (master && master.workingHours) {
        startHour = parseInt(master.workingHours.start) || 9;
        endHour = parseInt(master.workingHours.end) || 18;
      }
    }

    // Генерируем возможные слоты каждые 30 минут
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        if (hour === endHour - 1 && minute === 30) continue; // последний слот не должен выходить за конец
        const time = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
        const end = new Date(`${date}T${time}`);
        end.setMinutes(end.getMinutes() + totalDuration);
        const endTime = `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
        if (endTime > `${endHour}:00`) continue; // услуга не умещается до конца рабочего дня

        // Проверяем занятость
        const Appointment = require('../../models/beauty/Appointment');
        const conflict = await Appointment.findOne({
          tenantId,
          date,
          masterId: masterId || { $exists: true }, // любой мастер
          $or: [
            { time: time },
            { time: { $lt: endTime, $gte: time } }  // упрощённо
          ]
        });
        if (!conflict) {
          slots.push({ time, available: true });
        }
      }
    }
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;