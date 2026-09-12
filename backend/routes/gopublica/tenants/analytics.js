const express = require('express');
const router = express.Router();
const Order = require('../../../models/food/Order');
const Reservation = require('../../../models/food/Reservation');
const Customer = require('../../../models/Customer');
const MenuItem = require('../../../models/food/MenuItem');

/**
 * GET /api/gopublica/tenants/analytics?tenantId=&from=&to=
 * Aggregated analytics: order count, revenue, reservation count, customer count, top items.
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, from, to } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const hasDate = Object.keys(dateFilter).length > 0;

    const orderQuery = { tenantId };
    if (hasDate) orderQuery.createdAt = dateFilter;

    const reservationQuery = { tenantId };
    if (hasDate) reservationQuery.createdAt = dateFilter;

    const [
      orderCount,
      revenueResult,
      reservationCount,
      customerCount,
      menuItemCount,
      topOrders,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(orderQuery),
      Order.aggregate([
        { $match: orderQuery },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, avg: { $avg: '$pricing.total' } } },
      ]),
      Reservation.countDocuments(reservationQuery),
      Customer.countDocuments({ tenantId }),
      MenuItem.countDocuments({ tenantId }),
      Order.aggregate([
        { $match: orderQuery },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Order.find(orderQuery).sort({ createdAt: -1 }).limit(5).select('createdAt status pricing.total items').lean(),
    ]);

    const rev = revenueResult[0] || { total: 0, avg: 0 };

    res.json({
      orderCount,
      totalRevenue: rev.total || 0,
      avgOrderValue: Math.round(rev.avg || 0),
      reservationCount,
      customerCount,
      menuItemCount,
      topItems: topOrders,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
