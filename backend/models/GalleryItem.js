const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
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
  image: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Compound index for public route: find({ tenantId, $or: [{ branchId }, { branchId: null }] }).sort({ order: 1, createdAt: -1 })
galleryItemSchema.index({ tenantId: 1, branchId: 1, order: 1 });

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/modelHooks');

registerRevalidationHooks(galleryItemSchema, {
  modelName: 'GalleryItem',
  getTags: (doc) => [
    `gallery:${doc.tenantId}`,
    `gallery:${doc.tenantId}:${doc.branchId || 'global'}`,
  ],
  getBranchId: (doc) => doc.branchId || null,
  getEntityId: (doc) => doc._id.toString(),
});

const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);

module.exports = GalleryItem;