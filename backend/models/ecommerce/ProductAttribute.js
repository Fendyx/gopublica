const mongoose = require('mongoose');

const productAttributeSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['author', 'publisher', 'genre', 'language', 'series', 'custom'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    translations: {
      type: Map,
      of: new mongoose.Schema({ name: { type: String, default: '' } }, { _id: false }),
      default: {},
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique per tenant + type + slug
productAttributeSchema.index({ tenantId: 1, type: 1, slug: 1 }, { unique: true });

// For searching attributes by name
productAttributeSchema.index({ tenantId: 1, type: 1, name: 1 });

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../../services/content/modelHooks');

registerRevalidationHooks(productAttributeSchema, {
  modelName: 'ProductAttribute',
  getTags: (doc) => [
    `attributes:${doc.tenantId}`,
    `menu:${doc.tenantId}`,
  ],
  getBranchId: () => null,
  getEntityId: (doc) => doc._id.toString(),
});

const ProductAttribute = mongoose.model('ProductAttribute', productAttributeSchema);

module.exports = ProductAttribute;
