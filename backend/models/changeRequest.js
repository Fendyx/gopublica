const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },

  // Что нужно сделать
  title:       { type: String, required: true },
  description: { type: String, default: '' },

  // Статус работы
  status: {
    type: String,
    enum: ['new', 'approved', 'in_progress', 'done', 'rejected'],
    default: 'new',
  },

  // Финансы
  price:    { type: Number, default: 0 }, // 0 = входит в подписку
  billable: { type: Boolean, default: false }, // true = дополнительная оплата

  // Приоритет
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },

  // Кто ведёт
  assignedTo: { type: String, default: '' },

  // Когда завершили
  completedAt: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);