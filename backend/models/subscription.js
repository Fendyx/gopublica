const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date:   { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  note:   { type: String, default: '' }, // 'Bank transfer', 'Cash', 'Stripe' и тд
  paidBy: { type: String, default: '' }, // кто зафиксировал платёж
}, { _id: true });

const subscriptionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },

  // Тариф
  plan: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium'],
    default: 'Basic',
  },
  amount: { type: Number, required: true }, // в евро

  // Статус
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active',
  },

  // Биллинг
  startDate:       { type: Date, default: Date.now },
  nextBillingDate: { type: Date, required: true },

  // История платежей — массив внутри документа
  paymentHistory: [paymentSchema],

  // Что включено в тариф (можно кастомизировать под клиента)
  includes: [{ type: String }],

  // Stripe (пустые до Фазы 5)
  stripeSubscriptionId: { type: String, default: null },
  stripeStatus:         { type: String, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);