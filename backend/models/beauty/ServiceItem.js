const mongoose = require("mongoose");

const serviceItemSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    categoryKey: { type: String, default: '' },
    image: { type: String, default: "" },
    isVegetarian: Boolean,       // можно переименовать позже, но не обязательно
    isSpicy: Boolean,
    order: { type: Number, default: 0 },
    translations: {
      type: Map,
      of: new mongoose.Schema(
        {
          name: { type: String, default: "" },
          description: { type: String, default: "" },
        },
        { _id: false },
      ),
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BeautyService", serviceItemSchema);