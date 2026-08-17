const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    body: {
      type: String,
    },
    author: {
      type: String,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
  },
  { timestamps: true }
);

// Ensure unique slug per tenant
articleSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Article', articleSchema);
