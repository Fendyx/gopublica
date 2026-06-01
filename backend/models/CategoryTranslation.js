const mongoose = require('mongoose');

const categoryTranslationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, default: '' }, // основное название
  translations: { type: Map, of: String, default: {} },
  addedByTenants: [{ type: String }],
});

module.exports = mongoose.model('CategoryTranslation', categoryTranslationSchema);