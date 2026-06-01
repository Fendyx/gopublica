const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true }, // основной язык
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    categoryKey: {
    type: String,
    default: '', // если пусто – категория не стандартная и переводы вручную? Нет, мы всегда будем заполнять.
  },
    image: { type: String, default: "" },
    isVegetarian: Boolean,
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

module.exports = mongoose.model("MenuItem", menuItemSchema);
