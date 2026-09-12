const express = require('express');
const router = express.Router();
const Reservation = require('../../../models/food/Reservation');

/**
 * GET /api/gopublica/tenants/reservations?tenantId=&status=&page=&limit=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, status, page = '1', limit = '50' } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const filter = { tenantId };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter).sort({ date: -1, time: -1 }).skip(skip).limit(limitNum).lean(),
      Reservation.countDocuments(filter),
    ]);

    res.json({ reservations, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/reservations/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/reservations/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const reservation = await Reservation.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
