const express = require('express');
const router = express.Router();
const GalleryItem = require('../../models/GalleryItem');
const authTenant = require('../../middleware/authTenant');

// Публичный: получить галерею по tenantId
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const items = await GalleryItem.find({ tenantId }).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: добавить изображение
router.post('/', authTenant, async (req, res) => {
  try {
    const { image, caption, order } = req.body;
    const newItem = new GalleryItem({
      tenantId: req.tenantId,
      image,
      caption,
      order,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: удалить
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.tenantId !== req.tenantId) return res.status(403).json({ error: 'Forbidden' });

    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;