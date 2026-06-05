const mongoose = require('mongoose');

const beautyCategorySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  key: { type: String, required: true, unique: true },
  name: { type: String, default: '' }, // основное название
  translations: { type: Map, of: String, default: {} },
  businessType: {
    type: String,
    enum: ['beauty', 'barbershop', 'grooming', 'all'],
    default: 'all',
  },
  addedByTenants: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('BeautyCategory', beautyCategorySchema);