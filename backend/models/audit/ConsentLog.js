const mongoose = require('mongoose');

/**
 * Centralized GDPR consent audit log.
 *
 * One row per (entity × consent-type) — so a single form submission that
 * grants terms + privacy + marketing produces 3 rows.
 *
 * Designed for:
 *   - Cross-entity audit queries ("all consents from IP X")
 *   - Marketing consent revocation
 *   - GDPR data-subject access requests
 *
 * The embedded `_consent` sub-document on each transactional model is the
 * primary proof-of-consent; this collection is the secondary audit index.
 */
const consentLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: [
        'Order',
        'Reservation',
        'ServiceAppointment',
        'BeautyAppointment',
        'JobApplication',
        'CustomerUser',
        'TenantUser',
        'DemoRequest',
      ],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerUser',
      default: null,
    },
    type: {
      type: String,
      enum: ['terms', 'privacy', 'marketing'],
      required: true,
    },
    granted: {
      type: Boolean,
      required: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    consentVersion: {
      type: String,
      default: '1.0',
    },
  },
  { timestamps: true }
);

consentLogSchema.index({ entityType: 1, entityId: 1 });
consentLogSchema.index({ tenantId: 1, createdAt: -1 });
consentLogSchema.index({ ip: 1 });

module.exports = mongoose.model('ConsentLog', consentLogSchema);
