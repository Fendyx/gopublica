const mongoose = require('mongoose');

const specSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
    keyI18n: { type: Map, of: String, default: {} },
    valueI18n: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const platformProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleI18n: {
      type: Map,
      of: String,
      default: {},
    },
    description: {
      type: String,
      default: '',
    },
    descriptionI18n: {
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['EUR', 'PLN', 'USD'],
      default: 'EUR',
    },
    photo: {
      type: String,
      default: '',
    },
    gallery: [
      {
        type: String,
      },
    ],
    specs: {
      type: [specSchema],
      default: [],
    },
    targetNiches: [
      {
        type: String,
        enum: ['food', 'restaurant', 'beauty', 'auto', 'ecommerce', 'all'],
      },
    ],
    category: {
      type: String,
      enum: ['hardware', 'digital', 'service'],
      default: 'hardware',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: -1, // -1 = unlimited
    },
  },
  { timestamps: true }
);

platformProductSchema.index({ targetNiches: 1, isActive: 1 });

module.exports = mongoose.model('PlatformProduct', platformProductSchema);
