const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  branchId: {
    type: String,
    default: null,
    index: true,
  },
  // The BranchSection (dynamic_form) that this submission originated from.
  // Sparse index so legacy job applications (no section) are not affected.
  sourceSectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BranchSection',
    sparse: true,
    index: true,
  },
  // Динамические поля (сохраняем как Map, чтобы легко расширять)
  fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Ссылка на загруженный файл резюме (если есть)
  resumeUrl: {
    type: String,
    default: '',
  },
  // Статус рассмотрения
  status: {
    type: String,
    enum: ['new', 'viewed', 'invited', 'rejected', 'hired'],
    default: 'new',
  },
  // Комментарий (может оставить менеджер)
  comment: {
    type: String,
    default: '',
  },
  // Дата и время подачи (автоматически)
}, { timestamps: true });

// Индекс для быстрой сортировки по дате
jobApplicationSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);