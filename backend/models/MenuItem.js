const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sku: String,
  price: Number,
  compareAtPrice: Number,
  stock: { type: Number, default: 0 },
  attributes: { type: Map, of: String }
}, { _id: false });

const menuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, default: null, index: true },
    baseItemId: { type: String, default: null },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    categoryKey: { type: String, default: '' },
    image: { type: String, default: "" },
    isVegetarian: Boolean,
    isSpicy: Boolean,
    order: { type: Number, default: 0 },
    hasPersonalization: { type: Boolean, default: false },
      productType: {
        type: String,
        enum: ['food', 'service', 'physical_product', 'digital'],
        default: 'food'
      },
      sku: String,
  stock: { type: Number, default: 0 },
  compareAtPrice: Number,
  images: [String],           // дополнительные картинки
  weight: Number,
  weightUnit: { type: String, enum: ['g','kg','lb'], default: 'kg' },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  tags: [String],
  variants: [variantSchema],
    modifierGroups: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, enum: ['radio', 'checkbox'], required: true },
      required: { type: Boolean, default: false },
      minSelect: { type: Number, default: 0 },
      maxSelect: { type: Number, default: 0 },
      // ДОБАВЛЕНО: Переводы для названия группы
      translations: {
        type: Map,
        of: new mongoose.Schema({ name: { type: String, default: "" } }, { _id: false }),
        default: {},
      },
      options: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        // ДОБАВЛЕНО: Переводы для названия опции
        translations: {
          type: Map,
          of: new mongoose.Schema({ name: { type: String, default: "" } }, { _id: false }),
          default: {},
        }
      }]
    }],
    translations: {
      type: Map,
      of: new mongoose.Schema({ name: { type: String, default: "" }, description: { type: String, default: "" } }, { _id: false }),
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MenuItem", menuItemSchema);