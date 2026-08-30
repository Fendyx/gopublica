const mongoose = require('mongoose');

/**
 * Universal service booking model.
 *
 * Designed to serve any niche (auto detailing, barbershops, beauty salons,
 * clinics, etc.) by combining a fixed core (tenant isolation, customer link,
 * time window, status lifecycle) with a flexible `metadata` Map for
 * niche-specific attributes (e.g. carMake, bodyType, vehiclePlate).
 *
 * Isolation contract:
 *   - `tenantId`  : discriminator for the business (required, indexed)
 *   - `branchId`  : discriminator for the physical location (required, indexed)
 *   Every query MUST filter by `tenantId` (and usually `branchId`).
 */
const serviceAppointmentSchema = new mongoose.Schema(
  {
    // ─── Multi-tenancy isolation ─────────────────────────────────────────────
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    branchId: {
      type: String,
      required: true,
      index: true,
    },

    // ─── Client information ──────────────────────────────────────────────────
    // Linked account customer (optional — supports guest checkout / walk-ins).
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    // Snapshot for unauthenticated / guest bookings. Kept even when customerId
    // is set, so historical records remain readable if the customer is deleted.
    guestInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },

    // ─── Booking details ────────────────────────────────────────────────────
    // Array of booked services. Name and price are frozen at booking time so
    // that historical appointments remain accurate even if the service catalog
    // is later edited or the service is deleted.
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
          default: null,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true, default: 0 },
      },
    ],

    // Exact start time of the appointment (UTC). Use Date, not strings, so
    // overlap / availability queries can use $gte / $lt efficiently.
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Exact end time. Derived from startAt + sum(service durations) on write.
    endAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },

    // ─── Dynamic metadata (niche-specific attributes) ───────────────────────
    // Flexible key-value store for anything not covered by the core schema.
    // Examples:
    //   auto:    { carMake: 'BMW', carModel: 'M3', bodyType: 'Sedan', plate: 'XYZ-123' }
    //   barber:  { preferredBarber: 'John', haircutType: 'Fade' }
    //   beauty:  { treatmentArea: 'Face', skinType: 'Oily' }
    // Using Mixed so values can be strings, numbers, or booleans as needed.
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Free-text client comment / special request.
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Compound index for the most common query: "all appointments for a branch
// within a time window" — used by availability checks and calendar views.
serviceAppointmentSchema.index({ tenantId: 1, branchId: 1, startAt: 1 });
serviceAppointmentSchema.index({ tenantId: 1, branchId: 1, status: 1 });

module.exports = mongoose.model('ServiceAppointment', serviceAppointmentSchema);
