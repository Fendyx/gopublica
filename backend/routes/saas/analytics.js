const express = require('express');
const router  = express.Router();
const Analytics = require('../../models/analytics/Analytics');
const Order = require('../../models/food/Order');
const Reservation = require('../../models/food/Reservation');
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/auth/tenant');

// POST /api/saas/analytics/track  - публичный, вызывается из Next.js API route
router.post('/track', async (req, res) => {
  try {
    const { tenantId, hash, city, device, date } = req.body;
    if (!tenantId || !hash || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверяем - был ли этот хэш сегодня
    const existing = await Analytics.findOne({ tenantId, date, visitorsHashes: hash });
    const isUnique = !existing;

    const incUpdate = { totalViews: 1 };
    if (isUnique) incUpdate.uniqueVisitors = 1;
    if (city)     incUpdate[`cities.${city}`]    = 1;
    if (device)   incUpdate[`devices.${device}`] = 1;

    const update = { $inc: incUpdate };
    if (isUnique) update.$addToSet = { visitorsHashes: hash };

    await Analytics.findOneAndUpdate(
      { tenantId, date },
      update,
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/saas/analytics?days=30  - защищён, для дашборда
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const days = Math.min(parseInt(req.query.days) || 30, 90);

    // Генерируем массив дат
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().slice(0, 10);
    });

    const records = await Analytics.find({ tenantId, date: { $in: dates } });
    const recordsMap = Object.fromEntries(records.map(r => [r.date, r]));

    // Timeline с заполнением пустых дней нулями
    const timeline = dates.map(date => ({
      date,
      totalViews:     recordsMap[date]?.totalViews     ?? 0,
      uniqueVisitors: recordsMap[date]?.uniqueVisitors ?? 0,
    }));

    // Агрегируем города и устройства за период
    const cities = {};
    const devices = {};
    let totalViews = 0;
    let uniqueVisitors = 0;

    for (const r of records) {
      totalViews     += r.totalViews;
      uniqueVisitors += r.uniqueVisitors;
      for (const [k, v] of (r.cities  ?? [])) cities[k]  = (cities[k]  || 0) + v;
      for (const [k, v] of (r.devices ?? [])) devices[k] = (devices[k] || 0) + v;
    }

    // ── Business metrics from Order model ────────────────────────────
    const tenant = await TenantSettings.findOne({ tenantId }).lean();
    const isEcommerce = tenant?.niche === 'ecommerce';

    // Determine date boundaries for Order queries
    const fromDate = new Date(dates[0] + 'T00:00:00.000Z');
    const toDate = new Date(dates[dates.length - 1] + 'T23:59:59.999Z');

    // Aggregate revenue + orders from completed/paid orders
    const orderAgg = await Order.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: fromDate, $lte: toDate },
          status: { $in: ['paid', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalRevenue: { $sum: '$pricing.total' },
          orderCount:   { $sum: 1 },
          itemQuantity: { $sum: { $sum: '$items.quantity' } },
        },
      },
    ]);

    const orderAggMap = Object.fromEntries(orderAgg.map(r => [r._id, r]));

    // Sales timeline (per-day revenue + orders)
    const salesTimeline = dates.map(date => ({
      date,
      revenue: orderAggMap[date]?.totalRevenue ?? 0,
      orders:  orderAggMap[date]?.orderCount ?? 0,
    }));

    // Sales summary totals
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItems = 0;
    for (const r of orderAgg) {
      totalRevenue += r.totalRevenue;
      totalOrders += r.orderCount;
      totalItems += r.itemQuantity;
    }
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const conversionRate = uniqueVisitors > 0
      ? ((totalOrders / uniqueVisitors) * 100).toFixed(1)
      : '0.0';

    // ── Reservation count (food niche only, not ecommerce) ─────────────
    let reservationCount = 0;
    if (!isEcommerce) {
      reservationCount = await Reservation.countDocuments({
        tenantId,
        date: { $gte: dates[0], $lte: dates[dates.length - 1] },
        status: { $in: ['pending', 'confirmed'] },
      });
    }

    // ── Top items (best sellers by quantity) ──────────────────────────
    const topItemsAgg = await Order.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: fromDate, $lte: toDate },
          status: { $in: ['paid', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    const topItems = topItemsAgg.map(r => ({
      name:     r._id,
      quantity: r.totalQuantity,
      revenue:  r.totalRevenue,
    }));

    // ── Period comparison (previous equal-length period) ──────────────
    const prevToDate = new Date(fromDate);
    prevToDate.setMilliseconds(prevToDate.getMilliseconds() - 1);
    const prevFromDate = new Date(prevToDate);
    prevFromDate.setDate(prevFromDate.getDate() - days);

    const prevOrderAgg = await Order.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: prevFromDate, $lte: prevToDate },
          status: { $in: ['paid', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          orderCount:   { $sum: 1 },
        },
      },
    ]);

    // Previous period audience data
    const prevDates = Array.from({ length: days }, (_, i) => {
      const d = new Date(prevFromDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const prevRecords = await Analytics.find({ tenantId, date: { $in: prevDates } });
    let prevTotalViews = 0;
    let prevUniqueVisitors = 0;
    for (const r of prevRecords) {
      prevTotalViews     += r.totalViews;
      prevUniqueVisitors += r.uniqueVisitors;
    }

    const prevTotalRevenue = prevOrderAgg[0]?.totalRevenue ?? 0;
    const prevTotalOrders  = prevOrderAgg[0]?.orderCount ?? 0;

    function deltaPercent(current, previous) {
      if (previous === 0) return current > 0 ? '+100' : '0';
      const pct = ((current - previous) / previous) * 100;
      return pct >= 0 ? `+${Math.round(pct)}` : String(Math.round(pct));
    }

    // ── Conversion funnel ────────────────────────────────────────────
    const funnel = [
      { step: 'visitors', value: uniqueVisitors },
      { step: 'views',    value: totalViews },
      { step: 'orders',   value: totalOrders },
      { step: 'revenue',  value: totalRevenue },
    ];

    res.json({
      totalViews,
      uniqueVisitors,
      timeline,
      cities:  Object.entries(cities).map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value).slice(0, 8),
      devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
      salesTimeline,
      salesSummary: {
        totalRevenue,
        totalOrders,
        avgCheck,
        conversionRate,
        totalItems,
        reservationCount,
      },
      topItems,
      funnel,
      comparison: {
        views:     { current: totalViews,     previous: prevTotalViews,     delta: deltaPercent(totalViews, prevTotalViews) },
        visitors:  { current: uniqueVisitors,  previous: prevUniqueVisitors, delta: deltaPercent(uniqueVisitors, prevUniqueVisitors) },
        revenue:   { current: totalRevenue,    previous: prevTotalRevenue,   delta: deltaPercent(totalRevenue, prevTotalRevenue) },
        orders:    { current: totalOrders,      previous: prevTotalOrders,    delta: deltaPercent(totalOrders, prevTotalOrders) },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;