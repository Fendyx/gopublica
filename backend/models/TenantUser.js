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
    required: true,
  },
  name:  { type: String, default: '' },
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
  // внутри schema
  consents: {
    terms: { type: Boolean, default: false },
    privacy: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    lastUpdated: Date
  },

}, { timestamps: true });

tenantUserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model('TenantUser', tenantUserSchema);