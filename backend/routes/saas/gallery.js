const express = require('express');
const router = express.Router();
const GalleryItem = require('../../models/GalleryItem');
const authTenant = require('../../middleware/authTenant');

// Публичный: получить галерею по tenantId и опционально branchId
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    let query = { tenantId };
    if (branchId) {
      query = {
        tenantId,
        $or: [
          { branchId: branchId },
          { branchId: null }
        ]
      };
    } else {
      // без branchId – только глобальные
      query = { tenantId, branchId: null };
    }

    const items = await GalleryItem.find(query).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: добавить изображение (с branchId)
router.post('/', authTenant, async (req, res) => {
  try {
    const { image, caption, order, branchId } = req.body;
    const newItem = new GalleryItem({
      tenantId: req.tenantId,
      branchId: branchId || null,  // если не передан – глобальное
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

// Защищённый: удалить (проверка tenantId уже есть, дополнительная проверка на branchId не нужна – id уникален)
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