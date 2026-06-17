// backend/models/CategoryTranslation.js
const mongoose = require('mongoose');

const categoryTranslationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  translations: { type: Map, of: String, default: {} },
  addedByTenants: [{ type: String }],
  icon: { type: String, default: '' }, // 👈 новое поле: эмодзи или любая строка
});

module.exports = mongoose.model('CategoryTranslation', categoryTranslationSchema);