const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerUser',
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index — one wishlist entry per customer per product per tenant
wishlistSchema.index({ tenantId: 1, customerUserId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
