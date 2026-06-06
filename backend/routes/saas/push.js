const express = require('express')
const router = express.Router()
const webpush = require('web-push')
const PushSubscription = require('../../models/PushSubscription')
const authTenant = require('../../middleware/authTenant')

// Сохранить push-подписку браузера
router.post('/subscribe', authTenant, async (req, res) => {
  try {
    const { subscription } = req.body
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Некорректная подписка' })
    }
    await PushSubscription.findOneAndUpdate(
      { tenantId: req.tenantId, endpoint: subscription.endpoint },
      { tenantId: req.tenantId, endpoint: subscription.endpoint, subscription },
      { upsert: true, new: true }
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Удалить подписку (при выходе или отзыве разрешения)
router.delete('/subscribe', authTenant, async (req, res) => {
  try {
    const { endpoint } = req.body
    if (!endpoint) return res.status(400).json({ error: 'endpoint обязателен' })
    await PushSubscription.deleteOne({ tenantId: req.tenantId, endpoint })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router