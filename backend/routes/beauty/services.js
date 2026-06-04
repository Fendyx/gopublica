const express = require('express');
const router = express.Router();
const BeautyService = require('../../models/beauty/ServiceItem');
const authTenant = require('../../middleware/authTenant');

// Публичный: получение услуг для сайта
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const items = await BeautyService.find({ tenantId }).sort({ categoryKey: 1, order: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: добавление услуги
router.post('/', authTenant, async (req, res) => {
  try {
    const { name, description, price, categoryKey, image, isVegetarian, isSpicy, order, translations } = req.body;
    const newItem = new BeautyService({
      tenantId: req.tenantId,
      name, description, price, categoryKey, image, isVegetarian, isSpicy, order, translations,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: обновление
router.put('/:id', authTenant, async (req, res) => {
  try {
    const item = await BeautyService.findById(req.params.id);
    if (!item || item.tenantId !== req.tenantId) return res.status(404).json({ error: 'Not found' });
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: удаление
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const item = await BeautyService.findById(req.params.id);
    if (!item || item.tenantId !== req.tenantId) return res.status(404).json({ error: 'Not found' });
    await BeautyService.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;