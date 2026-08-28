const mongoose = require('mongoose');

/**
 * BranchSection — a configurable page section belonging to a branch.
 * 
 * SECTION TYPES & SETTINGS SHAPES:
 * 
 * 1. hero_video / hero
 *    settings: {
 *      mediaType: 'image' | 'video' | 'slider',  // default inferred from videoUrl
 *                                                // (legacy docs: videoUrl → 'video', else 'image')
 *      textAlignment: 'left' | 'center' | 'right', // default 'center'
 *      slides: [{                                  // only when mediaType === 'slider'
 *        imageUrl?: String,                        // at least one of the two
 *        videoUrl?: String                         // is required per slide
 *      }],                                         // max 10 items, unknown keys stripped
 *      videoUrl: String,           // URL to video file (MP4/WebM), used when mediaType === 'video'
 *      imageUrl: String,           // URL to background image, used when mediaType === 'image'
 *      primaryCta: {               // Primary call-to-action button
 *        label: String,            // Button text (localized via translations)
 *        targetSectionType: String // e.g. 'booking', 'menu_categories', 'entity_carousel'
 *      },
 *      secondaryCta: {             // Optional secondary CTA
 *        label: String,
 *        targetSectionType: String
 *      }
 *    }
 *    Validation: mediaType/textAlignment must be one of the enum values; slides
 *    are sanitized to { imageUrl?, videoUrl? } objects (at least one required)
 *    only when mediaType === 'slider'.
 *    All other keys are preserved. Enforced by services/branchSectionValidation.js.
 * 
 * 2. entity_carousel
 *    settings: {
 *      linkToDetailPage: Boolean,   // If true, clicking item navigates to /entity/:slug
 *      desktopItemsPerRow: Number   // Items per row on desktop: 3, 4, or 5 (default: 3)
 *    }
 *    Items are stored in BranchSectionItem collection (referenced by sectionId)
 *
 * 3. feature_carousel
 *    settings: {
 *      desktopItemsPerRow: Number   // Items per row on desktop: 3, 4, or 5 (default: 3)
 *    }
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
 *
 * 7. dynamic_form
 *    settings: {
 *      title: String,                                   // Form heading (base language)
 *      titleI18n: { [lang]: String },                    // Localized headings
 *      description: String,                             // Form description
 *      descriptionI18n: { [lang]: String },
 *      submitButtonText: String,
 *      submitButtonTextI18n: { [lang]: String },
 *      successMessage: String,
 *      successMessageI18n: { [lang]: String },
 *      notificationEmail: String,                       // Where submissions are emailed (stripped from public responses)
 *      storageTarget: 'job_application' | 'lead',       // Where submissions are stored (default: 'job_application')
 *      fields: [{                                       // Reuses the JobFormSettings field contract
 *        id: String,                                   // unique key
 *        label: String,                                 // base-language label
 *        labelI18n: { [lang]: String },
 *        type: 'text'|'email'|'tel'|'textarea'|'select'|'file'|'checkbox'|'radio',
 *        required: Boolean,
 *        options: [String],                              // for select/radio
 *        optionsI18n: { [lang]: [String] },
 *        placeholder: String,
 *        placeholderI18n: { [lang]: String },
 *        validation: { pattern: String, minLength: Number, maxLength: Number },
 *        order: Number
 *      }]  // max 30 items
 *    }
 *    Validation: fields must be an array; each field is sanitized to the
 *    whitelisted keys above; field ids must be unique and non-empty; type must
 *    be one of the allowed enums; options required for select/radio.
 *    Enforced by services/branchSectionValidation.js.
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
      validate: {
        validator: function (v) {
          // Allow empty (uses default) or lowercase slug format: 'home', 'partners', 'about-us'
          if (!v) return true;
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
        },
        message: props =>
          `page must be a lowercase slug (e.g. 'home', 'partners', 'about-us'), got: '${props.value}'`,
      },
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
        'dynamic_form',
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