const express = require('express');
const router = express.Router();
const BeautyMaster = require('../../models/beauty/Master');
const authTenant = require('../../middleware/authTenant');

// Публичный: список мастеров (с фильтром по услугам)
router.get('/', async (req, res) => {
  try {
    const { tenantId, serviceIds } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
    let filter = { tenantId, isActive: true };
    if (serviceIds) {
      const ids = serviceIds.split(',');
      filter.services = { $all: ids };
    }
    const masters = await BeautyMaster.find(filter).populate('services', 'name price duration');
    res.json(masters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: создание / обновление / удаление (сокращённо, при необходимости можно расширить)
router.post('/', authTenant, async (req, res) => {
  try {
    const master = new BeautyMaster({ ...req.body, tenantId: req.tenantId });
    await master.save();
    res.status(201).json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authTenant, async (req, res) => {
  try {
    const master = await BeautyMaster.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    );
    res.json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authTenant, async (req, res) => {
  try {
    await BeautyMaster.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;