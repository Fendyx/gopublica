const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Customer = require('../../models/Customer');
const Order = require('../../models/food/Order');
const authTenant = require('../../middleware/auth/tenant');

router.use(authTenant);

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// Helper: escape user input before embedding it into a RegExp
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── GET /api/saas/customers ──────────────────────────────────────────────
// Mini-CRM: list of the tenant's registered customers with aggregated stats.
//
// Query params:
//   search — matches name / email / phone (case-insensitive)
//   sort   — totalSpent (default) | totalOrders | lastOrderAt | name | newest
//   page   — 1-based page number (default 1)
//   limit  — page size, capped at 100 (default 20)
//
// Rules (agreed):
//   - Cancelled orders are excluded from totalOrders / totalSpent.
//   - Single currency per tenant → pricing.total is summed directly.
//   - Ungated module access (same policy as the dashboard).
//
// Starts from Customer (not Order) so customers that exist but have no
// qualifying orders yet still appear in the CRM with zeroed stats.
router.get('/', async (req, res) => {
  try {
    const { search = '', sort = 'totalSpent' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const pipeline = [];

    // 1) Scope to this tenant; filter by search early so lookups run on fewer docs.
    const match = { tenantId: req.tenantId };
    const searchTerm = String(search).trim();
    if (searchTerm) {
      const rx = new RegExp(escapeRegExp(searchTerm), 'i');
      match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    pipeline.push({ $match: match });

    // 2) Per-customer order stats via a correlated sub-pipeline on orders.
    pipeline.push({
      $lookup: {
        from: 'orders',
        let: { customerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$customerId', '$$customerId'] },
                  { $eq: ['$tenantId', req.tenantId] },
                  { $ne: ['$status', 'cancelled'] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$pricing.total' },
              lastOrderAt: { $max: '$createdAt' },
            },
          },
        ],
        as: 'stats',
      },
    });

    // 3) Flatten stats; customers without qualifying orders get zeroed values.
    pipeline.push({
      $addFields: {
        stats: {
          totalOrders: { $ifNull: [{ $arrayElemAt: ['$stats.totalOrders', 0] }, 0] },
          totalSpent: { $ifNull: [{ $arrayElemAt: ['$stats.totalSpent', 0] }, 0] },
          lastOrderAt: { $ifNull: [{ $arrayElemAt: ['$stats.lastOrderAt', 0] }, null] },
        },
      },
    });

    // 4) Sort + paginate.
    const sortMap = {
      totalSpent: { 'stats.totalSpent': -1, 'stats.lastOrderAt': -1 },
      totalOrders: { 'stats.totalOrders': -1, 'stats.lastOrderAt': -1 },
      lastOrderAt: { 'stats.lastOrderAt': -1 },
      name: { name: 1 },
      newest: { createdAt: -1 },
    };
    pipeline.push({ $sort: sortMap[sort] || sortMap.totalSpent });

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
              addresses: 1,
              createdAt: 1,
              createdViaOrder: 1,
              stats: 1,
            },
          },
        ],
      },
    });

    const [result] = await Customer.aggregate(pipeline);
    const total = result?.metadata?.[0]?.total || 0;

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      customers: result?.data || [],
    });
  } catch (err) {
    console.error('GET /api/saas/customers failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/saas/customers/:id ──────────────────────────────────────────
// Mini-CRM: single customer profile + full order history (newest first).
// Response shape: { customer, stats, orders }
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid customer id' });
    }

    // Tenant scoping guarantees one tenant cannot read another's customers.
    const customer = await Customer.findOne({ _id: id, tenantId: req.tenantId }).lean();
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Aggregated stats over non-cancelled orders (same rules as the list endpoint).
    const [statsAgg] = await Order.aggregate([
      {
        $match: {
          customerId: customer._id,
          tenantId: req.tenantId,
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    // Simple find for the order history; hide Stripe/payment internals.
    const orders = await Order.find({ customerId: customer._id, tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .select('-payment -__v')
      .lean();

    delete customer.passwordHash; // never leak credentials to the CRM UI

    res.json({
      customer,
      stats: {
        totalOrders: statsAgg?.totalOrders || 0,
        totalSpent: statsAgg?.totalSpent || 0,
        lastOrderAt: statsAgg?.lastOrderAt || null,
      },
      orders,
    });
  } catch (err) {
    console.error('GET /api/saas/customers/:id failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
