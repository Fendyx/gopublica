// !!! БЫЛО: отсутствовали эти две строки, из-за чего и возникла ошибка
const express = require('express');
const router = express.Router();
// !!! КОНЕц добавленного блока

const MenuItem = require('../../models/MenuItem');
const authTenant = require('../../middleware/authTenant');

// Публичный роут: получение меню по tenantId и опционально branchId
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

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
      query = { tenantId, branchId: null };
    }

    const items = await MenuItem.find(query).sort({ categoryKey: 1, order: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый роут: добавление блюда
router.post('/', authTenant, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      categoryKey,
      image,
      isVegetarian,
      isSpicy,
      order,
      translations,
      branchId,
    } = req.body;

    const newItem = new MenuItem({
      tenantId: req.tenantId,
      name,
      description,
      price,
      category,
      categoryKey,
      image,
      isVegetarian,
      isSpicy,
      order,
      translations,
      branchId: branchId || null,
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
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    if (item.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const { branchId, ...updateData } = req.body;
    Object.assign(item, updateData);
    if (branchId !== undefined) item.branchId = branchId;
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