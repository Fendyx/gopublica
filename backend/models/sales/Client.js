const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Откуда пришёл — связь с лидом сохраняется навсегда
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },

  // Основные контакты
  name:    { type: String, required: true },
  phone:   { type: String, required: true },
  email:   { type: String, default: '' },
  country: { type: String, default: '' }, // PL / ES / DE / UA

  // Бизнес
  businessType: { type: String, default: 'Other' },
  websiteUrl:   { type: String, default: '' }, // готовый сайт клиента
  
  // Источник (Google Maps ссылка и тд)
  source: { type: String, default: '' },

  // Кто ведёт клиента в команде
  assignedTo: { type: String, default: '' },

  // Статус клиента
  status: {
    type: String,
    enum: ['active', 'paused', 'churned'],
    default: 'active',
  },

  // Заметки по клиенту (не путать с change requests)
  notes: { type: String, default: '' },

  // Stripe (пустые до Фазы 5)
  stripeCustomerId: { type: String, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);