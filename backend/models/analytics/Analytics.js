const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  tenantId:        { type: String, required: true },
  date:            { type: String, required: true }, // "2026-06-15"
  totalViews:      { type: Number, default: 0 },
  uniqueVisitors:  { type: Number, default: 0 },
  visitorsHashes:  { type: [String], default: [] },
  cities:          { type: Map, of: Number, default: {} },
  devices:         { type: Map, of: Number, default: {} },
  clicks:          { type: Map, of: Number, default: {} },

  // ── Business metrics (aggregated from Order model) ──────────────────
  totalRevenue:    { type: Number, default: 0 },  // sum of pricing.total for paid/completed orders
  orderCount:      { type: Number, default: 0 },  // count of paid/completed orders
  itemQuantity:    { type: Number, default: 0 },  // total items sold
});

// Ключевой индекс - быстрый поиск и защита от дублей
analyticsSchema.index({ tenantId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);