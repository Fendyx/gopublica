const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const tenantUserSchema = new mongoose.Schema({
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
  },
  passwordHash: {
    type:     String,
    default:  null,  // null for Google OAuth users
  },
  name:  { type: String, default: '' },

  // ─── Google OAuth ──────────────────────────────────────────────
  // IMPORTANT: Do NOT use `default: null` here. In MongoDB, `sparse: true`
  // only omits documents where the field is completely absent from the doc.
  // If default is null, the field IS stored as null and the unique sparse
  // index treats multiple nulls as duplicates → E11000 duplicate key error.
  googleId: {
    type:    String,
    unique: true,
    sparse: true,
    // No default → field absent for email/password users → sparse index skips them
  },
  avatarUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  vatId:       { type: String, default: '' },

  // null пока мы не развернули сайт и не назначили tenantId
  tenantId: {
    type:    String,
    default: null,
    index:   true,
  },

  role: {
    type:    String,
    default: 'client_admin',
    enum:    ['client_admin', 'client_manager'],
  },
  isActive:           { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },

  // Stripe
  stripeCustomerId:     { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: {
    type:    String,
    enum:    ['none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete'],
    default: 'none',
  },
  subscriptionPlan: {
    type:    String,
    enum:    ['none', 'basic', 'pro'],
    default: 'none',
  },
  currentPeriodEnd: { type: Date, default: null },
  subscriptionCurrency: { type: String, default: null },
  // внутри schema
  consents: {
    terms: { type: Boolean, default: false },
    privacy: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    lastUpdated: Date
  },

  // ─── Telegram Bot Integration ───────────────────────────────────────────────
  telegramChatId: {
    type: String,
    default: null,
    index: true,
    sparse: true,
  },
  telegramLinkedAt: {
    type: Date,
    default: null,
  },
  telegramLinkToken: {
    type: String,
    default: null,
    sparse: true,
  },
  telegramLinkTokenExpiresAt: {
    type: Date,
    default: null,
  },

}, { timestamps: true });

// Compound indexes for Telegram
tenantUserSchema.index({ tenantId: 1, telegramChatId: 1 });
// telegramLinkToken index is created by field definition (sparse: true)

tenantUserSchema.methods.comparePassword = async function(candidate) {
  if (!this.passwordHash) return false; // Google OAuth user - no password set
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model('TenantUser', tenantUserSchema);