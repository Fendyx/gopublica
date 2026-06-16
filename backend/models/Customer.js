const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  email:    { type: String, required: true },
  phone:    { type: String, required: true },
  name:     { type: String, required: true },

  passwordHash: { type: String, default: null },

  addresses: [{
    label: { type: String, default: 'Дом' },
    street: String,
    city: String,
    zip: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    isDefault: { type: Boolean, default: false },
  }],

  ordersCount: { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },

  createdViaOrder: { type: Boolean, default: true },
}, { timestamps: true });

// Email уникален только в пределах одного ресторана
customerSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);