const express       = require('express');
const router        = express.Router();
const ChangeRequest = require('../models/changeRequest');
const auth          = require('../middleware/auth');
const checkRole     = require('../middleware/checkRole');

const ADMIN = ['admin', 'superadmin'];

// GET /api/change-requests?clientId=xxx — все правки (можно фильтровать по клиенту)
router.get('/', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId) filter.clientId = req.query.clientId;
    if (req.query.status)   filter.status   = req.query.status;

    const requests = await ChangeRequest.find(filter)
      .populate('clientId', 'name businessType') // подтягиваем имя клиента
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests', error: err.message });
  }
});

// POST /api/change-requests — создать правку
router.post('/', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { clientId, title, description, price, billable, priority, assignedTo } = req.body;

    if (!clientId || !title?.trim()) {
      return res.status(400).json({ message: 'clientId and title are required' });
    }

    const request = await ChangeRequest.create({
      clientId,
      title:       title.trim(),
      description: description?.trim() || '',
      price:       Number(price) || 0,
      billable:    Boolean(billable),
      priority:    priority || 'Medium',
      assignedTo:  assignedTo?.trim() || '',
    });

    // Populate для ответа
    await request.populate('clientId', 'name businessType');
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: 'Error creating request', error: err.message });
  }
});

// PUT /api/change-requests/:id — обновить статус / цену
router.put('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { status, price, billable, priority, assignedTo, description } = req.body;

    const update = {};
    if (status      !== undefined) update.status      = status;
    if (price       !== undefined) update.price       = Number(price);
    if (billable    !== undefined) update.billable    = billable;
    if (priority    !== undefined) update.priority    = priority;
    if (assignedTo  !== undefined) update.assignedTo  = assignedTo;
    if (description !== undefined) update.description = description;

    // Если статус меняется на done — фиксируем время завершения
    if (status === 'done') update.completedAt = new Date();

    const updated = await ChangeRequest.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    ).populate('clientId', 'name businessType');

    if (!updated) return res.status(404).json({ message: 'Request not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating request', error: err.message });
  }
});

// DELETE /api/change-requests/:id
router.delete('/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const deleted = await ChangeRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting request', error: err.message });
  }
});

module.exports = router;