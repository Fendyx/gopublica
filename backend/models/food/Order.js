const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: false, // optional — ticketed events have no MenuItem
    index: true,
  },
  itemType: {
    type: String,
    enum: ['menu_item', 'ticket'],
    default: 'menu_item',
  },
  name:       { type: String, required: true },
  basePrice:  { type: Number, required: true }, // Базовая цена
  price:      { type: Number, required: true }, // Итоговая цена (с модификаторами)
  quantity:   { type: Number, required: true, min: 1 },
  notes:      { type: String, default: '' },
  // НОВОЕ ПОЛЕ
  modifiers: [{
    groupId: String,
    groupName: String,
    optionId: String,
    optionName: String,
    priceImpact: Number
  }],
  // ── Ticket metadata (used when itemType === 'ticket') ──
  ticketMeta: {
    eventId:    { type: String, default: null },
    articleId:  { type: String, default: null },
    eventDate:  { type: Date, default: null },
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String, default: null, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },

fulfillment: {
    // 'digital' = ticket-only orders (no physical shipping involved)
    type: { type: String, enum: ['pickup', 'delivery', 'digital'], required: true },
    scheduledFor: { type: Date, default: null },

    // для обычной доставки
    address: {
      street: String,
      city: String,
      zip: String,
      coordinates: { lat: Number, lng: Number },
    },
    
    // ─── НОВОЕ: Данные пачкомата Furgonetka ──────────────────────────────────
    parcelLocker: {
      enabled: { type: Boolean, default: false },
      lockerId: String,       // код пачкомата, например "WAW01M"
      network: String,        // сеть (inpost, orlen, etc.)
      address: {
        street: String,
        city: String,
        zip: String,
      },
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

  // В схему Order добавь это поле:
    customerUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'CustomerUser', 
      index: true 
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

  // ─── НОВОЕ: Ссылка на отгрузку и этикетку Фургонетки ─────────────────────
  shipping: {
    provider: { type: String, default: 'furgonetka' },
    packageId: String,       // ID посылки в системе Фургонетки
    trackingNumber: String,  // трек-номер для отслеживания
    labelUrl: String,        // ссылка на PDF-этикетку
    status: { 
      type: String, 
      enum: ['pending', 'created', 'error'], 
      default: 'pending' 
    },
    error: String,           // текст ошибки, если генерация не удалась
  },

  locale: { type: String, default: 'pl' },

  // ── GDPR: Proof-of-consent snapshot (embedded for immutable audit) ──
  _consent: {
    terms:     { type: Boolean, default: null },
    privacy:   { type: Boolean, default: null },
    marketing: { type: Boolean, default: false },
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
    timestamp: { type: Date, default: null },
    version:   { type: String, default: '1.0' },
  },
}, { timestamps: true });

// ─── Conditional validation: delivery orders need a destination ──────────
// Runs on the always-present `fulfillment.type` path so it fires even when
// `address` itself is undefined (Mongoose skips validators on undefined paths).
// Rules:
//   - type === 'delivery'  → requires full address OR an identified parcel locker
//   - type === 'pickup' | 'digital' → no address needed
orderSchema.path('fulfillment.type').validate(function (value) {
  if (value !== 'delivery') return true;

  const f = this.fulfillment || {};

  // Parcel locker deliveries don't need a street address.
  // Accept BOTH payload shapes:
  //   - incoming request: { id, network, address }
  //   - stored document:  { enabled: true, lockerId, network, address }
  if (f.parcelLocker?.id || f.parcelLocker?.lockerId) return true;

  const addr = f.address;
  return Boolean(addr && addr.street && addr.city && addr.zip);
}, 'Delivery orders require a full shipping address (street, city, zip) or a parcel locker.');

module.exports = mongoose.model('Order', orderSchema);