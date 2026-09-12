const express = require('express');
const router = express.Router();
const Order = require('../../../models/food/Order');

/**
 * GET /api/gopublica/tenants/orders?tenantId=&status=&page=&limit=&from=&to=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, status, branchId, from, to, page = '1', limit = '50' } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const filter = { tenantId };
    if (status) filter.status = status;
    if (branchId) filter.branchId = branchId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gopublica/tenants/orders/:id?tenantId=
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const order = await Order.findOne({ _id: req.params.id, tenantId })
      .populate('customerId')
      .lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/orders/:id/status?tenantId=
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await Order.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    if (status === 'accepted') { order.confirmation.status = 'accepted'; order.confirmation.acceptedAt = new Date(); }
    if (status === 'cancelled') { order.confirmation.status = 'declined'; order.confirmation.declinedAt = new Date(); }
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
