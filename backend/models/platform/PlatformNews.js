const mongoose = require('mongoose');

const platformNewsSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
    },
    contentI18n: {
      type: Map,
      of: String,
      default: {},
    },
    type: {
      type: String,
      enum: ['info', 'update', 'announcement', 'promo'],
      default: 'info',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformNews', platformNewsSchema);
