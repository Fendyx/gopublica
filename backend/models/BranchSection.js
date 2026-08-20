const mongoose = require('mongoose');

/**
 * BranchSection — a configurable page section belonging to a branch.
 * 
 * SECTION TYPES & SETTINGS SHAPES:
 * 
 * 1. hero_video
 *    settings: {
 *      videoUrl: String,           // URL to video file (MP4/WebM)
 *      primaryCta: {               // Primary call-to-action button
 *        label: String,            // Button text (localized via translations)
 *        targetSectionType: String // e.g. 'booking', 'menu_categories', 'entity_carousel'
 *      },
 *      secondaryCta: {             // Optional secondary CTA
 *        label: String,
 *        targetSectionType: String
 *      }
 *    }
 * 
 * 2. entity_carousel
 *    settings: {
 *      linkToDetailPage: Boolean   // If true, clicking item navigates to /entity/:slug
 *    }
 *    Items are stored in BranchSectionItem collection (referenced by sectionId)
 * 
 * 3. feature_carousel
 *    settings: { }                 // No special settings needed
 *    Items are stored in BranchSectionItem collection (referenced by sectionId)
 *    No detail page link — purely presentational cards
 * 
 * 4. booking
 *    settings: {
 *      sideContentType: 'none' | 'map' | 'text',  // default 'none'
 *      address: String,                           // Display address (used when sideContentType === 'map')
 *      customText: String,                        // Custom text (used when sideContentType === 'text')
 *    }
 *    Reuses existing reservation/appointment endpoints.
 *    Validation: sideContentType must be one of the enum values; address and
 *    customText are coerced to strings. Enforced by services/branchSectionValidation.js.
 * 
 * 5. map
 *    settings: {
 *      latitude: Number,
 *      longitude: Number,
 *      address: String             // Display address
 *    }
 * 
 * 6. menu_categories
 *    settings: {
 *      categoryKeys: [String]      // Array of CategoryTranslation.key values to display
 *    }
 */

const branchSectionSchema = new mongoose.Schema(
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
    page: {
      type: String,
      default: 'home',
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'hero_video',
        'hero',
        'entity_carousel',
        'feature_carousel',
        'booking',
        'map',
        'menu_categories',
        'article_grid',
      ],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    translations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
branchSectionSchema.index({ tenantId: 1, branchId: 1, page: 1, order: 1 });
branchSectionSchema.index({ tenantId: 1, branchId: 1, isActive: 1 });

// Index for public route: find({ branchId, page, isActive }).sort({ order: 1 })
branchSectionSchema.index({ branchId: 1, page: 1, isActive: 1, order: 1 });

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/modelHooks');

registerRevalidationHooks(branchSectionSchema, {
  modelName: 'BranchSection',
  getTags: (doc) => [
    `sections:${doc.tenantId}:${doc.branchId}`,
    `page:${doc.tenantId}:${doc.branchId}:${doc.page}`,
  ],
  getBranchId: (doc) => doc.branchId,
  getEntityId: (doc) => doc._id.toString(),
});

const BranchSection = mongoose.model('BranchSection', branchSectionSchema);

module.exports = BranchSection;