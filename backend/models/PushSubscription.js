const mongoose = require('mongoose')

const pushSubscriptionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  subscription: { type: Object, required: true },
}, { timestamps: true })

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema)