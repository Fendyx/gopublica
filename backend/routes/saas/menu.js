const express = require('express');
const router = express.Router();
const MenuItem = require('../../models/MenuItem');
const authTenant = require('../../middleware/authTenant'); // исправлено!

// Публичный роут: получение меню по tenantId
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const items = await MenuItem.find({ tenantId }).sort({ category: 1, order: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый роут: добавление блюда
router.post('/', authTenant, async (req, res) => {
  try {
    const { name, description, price, category, image, isVegetarian, isSpicy, order } = req.body;

    const newItem = new MenuItem({
      tenantId: req.tenantId, // из токена, не из body!
      name,
      description,
      price,
      category,
      image,
      isVegetarian,
      isSpicy,
      order,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Ошибка в POST /api/saas/menu:', err);
    res.status(500).json({ error: err.message });
  }
});

// Обновление (защищённый)
router.put('/:id', authTenant, async (req, res) => {
  try {
    // Находим документ и проверяем, что он принадлежит текущему тенанту
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    if (item.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Обновляем
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление (защищённый)
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    if (item.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;