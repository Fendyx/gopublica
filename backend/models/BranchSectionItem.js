const mongoose = require('mongoose');

/**
 * BranchSectionItem — individual slides/cards for entity_carousel and feature_carousel sections.
 * 
 * USAGE:
 * - entity_carousel: Items represent entities with detail pages (e.g., "Our Concepts", "Team Members")
 *   - slug is REQUIRED and unique per tenant — used for detail page URLs (/entity/:slug)
 *   - translations.story: optional long-form content for detail page
 * - feature_carousel: Items are purely presentational cards (e.g., "Features", "Benefits")
 *   - slug is still required for DB uniqueness but not used for routing
 *   - translations.story: not used
 */

const branchSectionItemSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BranchSection',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    media: {
      type: {
        type: String,
        enum: ['video', 'image'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    order: {
      type: Number,
      default: 0,
    },
    translations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    body: {
      type: String,
      default: '',
    },
    gallery: [
      {
        type: {
          type: String,
          enum: ['image', 'video'],
          default: 'image',
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    attributes: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound indexes
branchSectionItemSchema.index({ tenantId: 1, branchId: 1, sectionId: 1, order: 1 });
branchSectionItemSchema.index({ tenantId: 1, slug: 1 }, { unique: true }); // Unique slug per tenant

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/modelHooks');

registerRevalidationHooks(branchSectionItemSchema, {
  modelName: 'BranchSectionItem',
  getTags: (doc) => [
    `sections:${doc.tenantId}:${doc.branchId}`,
    `entity:${doc.tenantId}:${doc.slug || doc._id}`,
  ],
  getBranchId: (doc) => doc.branchId,
  getEntityId: (doc) => doc.slug || doc._id.toString(),
});

const BranchSectionItem = mongoose.model('BranchSectionItem', branchSectionItemSchema);

module.exports = BranchSectionItem;