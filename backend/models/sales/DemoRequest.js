const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * DemoRequest
 * ----------
 * Public "Get a Free Demo" lead-generation funnel submissions.
 * Kept separate from the admin-gated `Lead` model because:
 *   - it is created by anonymous visitors (no createdBy / auth),
 *   - it carries funnel-specific data (goals, contactMethod, language, bestTimeToCall),
 *   - it has its own lifecycle (New → Contacted → Converted → Rejected).
 *
 * A DemoRequest can later be "converted" into a Lead by an admin
 * (see `convertedToLead` ref).
 */
const demoRequestSchema = new Schema(
  {
    // ── Step 1: Business type ────────────────────────────────────────
    businessType: {
      preset: { type: String, default: null }, // e.g. "Restaurant" | null
      custom: { type: String, default: null }, // free text when "Other" chosen
    },

    // ── Step 2: Goals ────────────────────────────────────────────────
    goals: {
      preset: [{ type: String }], // array of preset keys, e.g. ["onlineSales"]
      custom: { type: String, default: null }, // free text, optional
    },

    // ── Step 3: Preferred contact method + contact details ───────────
    contactMethod: {
      type: String,
      enum: ['phone', 'whatsapp', 'telegram'],
      required: true,
    },
    contact: {
      name: { type: String, required: true, trim: true, minlength: 2 },
      phone: { type: String, default: '' }, // required for phone & whatsapp
      telegramHandle: { type: String, default: '' }, // required for telegram
      preferredLanguage: { type: String, default: '' }, // required for phone
      bestTimeToCall: { type: String, default: '' }, // required for phone
    },

    // ── Meta ──────────────────────────────────────────────────────────
    locale: { type: String, default: 'en' }, // UI locale at submission time
    source: { type: String, default: 'website-demo-funnel' },
    consentAccepted: { type: Boolean, default: false },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },

    // ── Lifecycle ────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Converted', 'Rejected'],
      default: 'New',
    },

    // ── Future: one-click "Convert to Lead" in admin CRM ─────────────
    convertedToLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for the admin list view (most recent first)
demoRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DemoRequest', demoRequestSchema);
