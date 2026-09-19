const mongoose = require('mongoose');

const platformOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlatformProduct',
      required: true,
    },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    photo: { type: String, default: '' },
  },
  { _id: false }
);

const fulfillmentAddressSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    zip: { type: String, default: '' },
  },
  { _id: false }
);

const parcelLockerSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    lockerId: { type: String, default: '' },
    network: { type: String, default: '' },
    address: { type: fulfillmentAddressSchema, default: () => ({}) },
  },
  { _id: false }
);

const fulfillmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['parcel_locker', 'courier', 'cash_on_delivery'],
      required: true,
    },
    parcelLocker: { type: parcelLockerSchema, default: () => ({}) },
    address: { type: fulfillmentAddressSchema, default: () => ({}) },
    deliveryFee: { type: Number, default: 0 },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    provider: { type: String, default: null },
    packageId: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    labelUrl: { type: String, default: null },
    status: { type: String, enum: ['pending', 'created', 'error'], default: 'pending' },
    error: { type: String, default: null },
  },
  { _id: false }
);

const buyerContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

const platformOrderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    tenantName: {
      type: String,
      default: '',
    },
    buyerContact: {
      type: buyerContactSchema,
      default: () => ({}),
    },
    buyerType: {
      type: String,
      enum: ['private', 'business'],
      required: true,
    },
    businessName: {
      type: String,
      default: '',
    },
    nip: {
      type: String,
      default: '',
    },
    items: {
      type: [platformOrderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'cash_on_delivery'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    fulfillment: {
      type: fulfillmentSchema,
      required: true,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'PLN' },
    },
    shipping: {
      type: shippingSchema,
      default: () => ({}),
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    fulfillmentNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

platformOrderSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('PlatformOrder', platformOrderSchema);
