const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      unique: true, // one Article can have at most one Event
    },

    // ── Ticket commerce ──────────────────────────────
    isEvent: {
      type: Boolean,
      default: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTickets: {
      type: Number,
      required: true,
      min: 1,
    },
    ticketsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    ticketsRemaining: {
      type: Number,
      required: true,
      min: 0,
    },

    // ── Event scheduling ─────────────────────────────
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    eventTime: {
      type: String,
      default: '',
    },
    venueName: {
      type: String,
      default: '',
    },
    venueAddress: {
      type: String,
      default: '',
    },
    maxPerOrder: {
      type: Number,
      default: 10,
      min: 1,
    },

    // ── Status flags ─────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    isSoldOut: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Compound indexes ──────────────────────────────────
// List events for a tenant, sorted chronologically
eventSchema.index({ tenantId: 1, eventDate: 1 });

// Ensure one Article can have at most one Event (enforced by unique on articleId,
// but this compound index also speeds up lookups by tenant + article)
eventSchema.index({ tenantId: 1, articleId: 1 }, { unique: true });

// ─── Pre-save hook: derive isSoldOut ───────────────────
eventSchema.pre('save', function (next) {
  if (this.isModified('ticketsRemaining') || this.isModified('totalTickets')) {
    this.isSoldOut = this.ticketsRemaining <= 0;
  }
  next();
});

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/modelHooks');

registerRevalidationHooks(eventSchema, {
  modelName: 'Event',
  getTags: (doc) => [
    `events:${doc.tenantId}`,
    `event:${doc.tenantId}:${doc._id}`,
  ],
  getEntityId: (doc) => doc._id.toString(),
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;