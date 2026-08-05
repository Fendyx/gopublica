const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, default: null, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 1, default: 30 },
    categoryKey: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    translations: {
      type: Map,
      of: new mongoose.Schema(
        {
          name: { type: String, default: '' },
          description: { type: String, default: '' },
        },
        { _id: false },
      ),
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('BeautyService', serviceItemSchema);