const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:       { type: String, required: true },
  price:      { type: Number, required: true },   // цена за единицу на момент заказа (в злотых, например 12.50)
  quantity:   { type: Number, required: true, min: 1 },
  notes:      { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String, default: null, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },

  fulfillment: {
    type: { type: String, enum: ['pickup', 'delivery'], required: true },
    scheduledFor: { type: Date, default: null },

    // для доставки
    address: {
      street: String,
      city: String,
      zip: String,
      coordinates: { lat: Number, lng: Number },
    },
    deliveryInstructions: String,
    deliveryFee: { type: Number, default: 0 },   // стоимость доставки (злотые)
  },

  items: [orderItemSchema],

  customer: {
    name:  { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
  },

  pricing: {
    currency:    { type: String, default: 'pln' },
    subtotal:    { type: Number, required: true },  // сумма блюд
    deliveryFee: { type: Number, default: 0 },
    serviceFee:  { type: Number, required: true },  // комиссия платформы
    total:       { type: Number, required: true },  // итог к оплате
  },

  confirmation: {
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    acceptedAt: Date,
    declinedAt: Date,
    declineReason: String,
  },

  status: {
    type: String,
    enum: ['pending_payment', 'paid', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'],
    default: 'pending_payment',
  },

  payment: {
    checkoutSessionId: String,
    paymentIntentId: String,
    refundId: String,
    stripeFee: Number,
  },

  locale: { type: String, default: 'pl' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);