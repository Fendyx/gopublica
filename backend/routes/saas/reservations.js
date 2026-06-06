const express = require('express')
const router = express.Router()
const webpush = require('web-push')
const Reservation = require('../../models/Reservation')
const PushSubscription = require('../../models/PushSubscription')
const authTenant = require('../../middleware/authTenant')

// Публичный: создание брони
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.query
    if (!tenantId) return res.status(400).json({ error: 'tenantId обязателен' })

    const { name, phone, email, date, time, guests, comment } = req.body
    const reservation = new Reservation({ tenantId, name, phone, email, date, time, guests, comment })
    await reservation.save()

    // Отправляем push всем подписанным браузерам этого тенанта (даже если вкладка закрыта)
    const subs = await PushSubscription.find({ tenantId })
    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: '🍽️ Новое бронирование',
        body: `${name} · ${date} в ${time}${guests ? ` · ${guests} гостей` : ''}`,
        tag: `booking-${reservation._id}`,
        url: '/admin/reservations',
      })

      // Promise.allSettled — не падаем если одна подписка устарела
      const results = await Promise.allSettled(
        subs.map(sub => webpush.sendNotification(sub.subscription, payload))
      )

      // Удаляем невалидные подписки (410 Gone — браузер отписался)
      const expiredEndpoints = results
        .map((r, i) => ({ r, sub: subs[i] }))
        .filter(({ r }) => r.status === 'rejected' && r.reason?.statusCode === 410)
        .map(({ sub }) => sub.endpoint)

      if (expiredEndpoints.length > 0) {
        await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } })
      }
    }

    res.status(201).json(reservation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Защищённый: список броней
router.get('/', authTenant, async (req, res) => {
  try {
    const reservations = await Reservation.find({ tenantId: req.tenantId })
      .sort({ date: 1, time: 1 })
    res.json(reservations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Изменение статуса
router.patch('/:id', authTenant, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ error: 'Не найдено' })
    if (reservation.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' })
    reservation.status = req.body.status
    await reservation.save()
    res.json(reservation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Удаление
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ error: 'Не найдено' })
    if (reservation.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' })
    await Reservation.findByIdAndDelete(req.params.id)
    res.json({ message: 'Удалено' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router