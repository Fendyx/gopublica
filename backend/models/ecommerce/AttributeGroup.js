const mongoose = require('mongoose');

const attributeGroupSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    icon: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    translations: {
      type: Map,
      of: new mongoose.Schema({ name: { type: String, default: '' } }, { _id: false }),
      default: {},
    },
  },
  { timestamps: true }
);

// Unique slug per tenant
attributeGroupSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

// Sorting
attributeGroupSchema.index({ tenantId: 1, sortOrder: 1 });

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model()) ──
const { registerRevalidationHooks } = require('../../services/content/modelHooks');

registerRevalidationHooks(attributeGroupSchema, {
  modelName: 'AttributeGroup',
  getTags: (doc) => [
    `attributeGroups:${doc.tenantId}`,
    `attributes:${doc.tenantId}`,
    `menu:${doc.tenantId}`,
  ],
  getBranchId: () => null,
  getEntityId: (doc) => doc._id.toString(),
});

const AttributeGroup = mongoose.model('AttributeGroup', attributeGroupSchema);

module.exports = AttributeGroup;
