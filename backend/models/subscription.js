const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  plan: { type: String, enum: ['basic', 'pro'], default: 'basic' },
  status: { type: String, enum: ['active', 'past_due', 'canceled', 'incomplete'], default: 'incomplete' },
  currentPeriodEnd: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);