const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['primary', 'subdomain', 'landing', 'microsite'],
    default: 'primary',
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  subdomain: {
    type: String,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  },
  status: {
    type: String,
    enum: ['building', 'staging', 'live', 'error', 'paused'],
    default: 'building',
  },
  stagingUrl: {
    type: String,
    default: '',
  },
  liveUrl: {
    type: String,
    default: '',
  },
  niche: {
    type: String,
    enum: ['food', 'restaurant', 'beauty', 'auto', 'ecommerce'],
    default: 'food',
  },
  theme: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  lastDeployedAt: {
    type: Date,
    default: null,
  },
  deploymentLogs: [{
    status: { type: String, required: true },
    url: { type: String, default: '' },
    error: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  // Track which subscription plan this site was created under
  createdUnderPlan: {
    type: String,
    enum: ['none', 'basic', 'pro'],
    default: 'none',
  },
}, { timestamps: true });

// Compound index for tenant + active sites
siteSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for full URL
siteSchema.virtual('fullUrl').get(function() {
  if (this.liveUrl) return this.liveUrl;
  if (this.stagingUrl) return this.stagingUrl;
  if (this.domain) return `https://${this.domain}`;
  if (this.subdomain && this.domain) return `https://${this.subdomain}.${this.domain}`;
  return '#';
});

// Method to add deployment log
siteSchema.methods.addDeploymentLog = function(status, url = '', error = '') {
  this.deploymentLogs.push({ status, url, error, createdAt: new Date() });
  this.lastDeployedAt = new Date();
  this.status = status;
  return this.save();
};

// Static method to check site limits for a tenant
siteSchema.statics.checkSiteLimit = async function(tenantId, user) {
  const TenantUser = require('./TenantUser');
  const tenantUser = await TenantUser.findOne({ tenantId }).select('subscriptionPlan subscriptionStatus');
  
  if (!tenantUser) {
    return { allowed: false, reason: 'Tenant user not found' };
  }

  // Define limits per plan
  const limits = {
    none: 0,
    basic: 1,
    pro: 10, // Pro can have multiple sites
  };

  const plan = tenantUser.subscriptionPlan || 'none';
  const status = tenantUser.subscriptionStatus || 'none';
  
  // Only active/trialing subscriptions count
  const activeStatuses = ['active', 'trialing'];
  const effectivePlan = activeStatuses.includes(status) ? plan : 'none';
  const maxSites = limits[effectivePlan] || 0;

  const currentCount = await this.countDocuments({ tenantId, isActive: true });
  
  return {
    allowed: currentCount < maxSites,
    currentCount,
    maxSites,
    plan: effectivePlan,
    reason: currentCount >= maxSites 
      ? `Site limit reached (${maxSites} for ${effectivePlan} plan). Upgrade to Pro for more sites.`
      : null,
  };
};

module.exports = mongoose.model('Site', siteSchema);