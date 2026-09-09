const mongoose = require('mongoose');

const goPublicaNewsSchema = new mongoose.Schema(
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
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['company', 'product', 'event', 'tutorial', 'announcement'],
      default: 'company',
    },
    mediaType: {
      type: String,
      enum: ['text', 'photo', 'video'],
      default: 'text',
    },
    coverImage: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      default: '',
    },
    bodyI18n: {
      type: Map,
      of: String,
      default: {},
    },
    excerpt: {
      type: String,
      default: '',
    },
    excerptI18n: {
      type: Map,
      of: String,
      default: {},
    },
    seoTitle: {
      type: String,
      default: '',
    },
    seoTitleI18n: {
      type: Map,
      of: String,
      default: {},
    },
    seoDescription: {
      type: String,
      default: '',
    },
    seoDescriptionI18n: {
      type: Map,
      of: String,
      default: {},
    },
    author: {
      type: String,
      default: 'GoPublica Team',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedOrder: {
      type: Number,
      default: 0,
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

// Unique slug
goPublicaNewsSchema.index({ slug: 1 }, { unique: true });

// Homepage pinned query
goPublicaNewsSchema.index({ isPinned: 1, pinnedOrder: 1 });

// Public listing
goPublicaNewsSchema.index({ isActive: 1, publishedAt: -1 });

// Category filter
goPublicaNewsSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('GoPublicaNews', goPublicaNewsSchema);
