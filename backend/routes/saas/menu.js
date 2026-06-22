const express = require('express');
const router = express.Router();
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

// Защищённый роут: добавление продукта
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
      productType,
      hasPersonalization,
      modifierGroups,
      // новые поля
      sku,
      stock,
      compareAtPrice,
      images,       // массив URL дополнительных картинок
      weight,
      weightUnit,
      dimensions,
      tags,
      variants,
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
      productType: productType || 'food',
      hasPersonalization: hasPersonalization || false,
      modifierGroups: modifierGroups || [],
      sku: sku || '',
      stock: stock != null ? stock : 0,
      compareAtPrice: compareAtPrice || null,
      images: images || [],
      weight: weight || null,
      weightUnit: weightUnit || 'kg',
      dimensions: dimensions || { length: null, width: null, height: null, unit: 'cm' },
      tags: tags || [],
      variants: variants || [],
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

    const {
      name, description, price, category, categoryKey, image,
      isVegetarian, isSpicy, order, translations, branchId,
      productType, hasPersonalization, modifierGroups,
      sku, stock, compareAtPrice, images: imgs, weight, weightUnit,
      dimensions, tags, variants
    } = req.body;

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (category !== undefined) item.category = category;
    if (categoryKey !== undefined) item.categoryKey = categoryKey;
    if (image !== undefined) item.image = image;
    if (isVegetarian !== undefined) item.isVegetarian = isVegetarian;
    if (isSpicy !== undefined) item.isSpicy = isSpicy;
    if (order !== undefined) item.order = order;
    if (translations !== undefined) item.translations = translations;
    if (branchId !== undefined) item.branchId = branchId;
    if (productType !== undefined) item.productType = productType;
    if (hasPersonalization !== undefined) item.hasPersonalization = hasPersonalization;
    if (modifierGroups !== undefined) item.modifierGroups = modifierGroups;
    if (sku !== undefined) item.sku = sku;
    if (stock !== undefined) item.stock = stock;
    if (compareAtPrice !== undefined) item.compareAtPrice = compareAtPrice;
    if (imgs !== undefined) item.images = imgs;
    if (weight !== undefined) item.weight = weight;
    if (weightUnit !== undefined) item.weightUnit = weightUnit;
    if (dimensions !== undefined) item.dimensions = dimensions;
    if (tags !== undefined) item.tags = tags;
    if (variants !== undefined) item.variants = variants;

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