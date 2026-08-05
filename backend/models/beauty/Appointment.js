const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, default: null, index: true },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BeautyService',
      required: true,
      index: true,
    },
    masterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BeautyMaster',
      default: null,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    guestInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pay_now', 'pay_later', 'paid', 'refunded'],
      default: 'pay_later',
      index: true,
    },
    notes: { type: String, default: '' },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ tenantId: 1, branchId: 1, startAt: 1 });
appointmentSchema.index({ tenantId: 1, branchId: 1, status: 1 });

module.exports = mongoose.model('BeautyAppointment', appointmentSchema);