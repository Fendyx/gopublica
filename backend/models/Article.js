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

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/modelHooks');

registerRevalidationHooks(articleSchema, {
  modelName: 'Article',
  getTags: (doc) => [
    `articles:${doc.tenantId}`,
    `article:${doc.tenantId}:${doc.slug}`,
  ],
  getEntityId: (doc) => doc.slug,
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
