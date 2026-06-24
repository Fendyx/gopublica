// backend/routes/saas/categories.js
const express = require('express');
const router = express.Router();
const CategoryTranslation = require('../../models/CategoryTranslation');
const authTenant = require('../../middleware/authTenant');

// ПУБЛИЧНЫЙ РОУТ: Получить доступные категории (свои + глобальные БЕЗ дубликатов)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const niche = req.query.niche || 'food';
    if (!tenantId) {
      const globals = await CategoryTranslation.find({ tenantId: null, niche }).lean();
      return res.json(globals);
    }
    const tenantCats = await CategoryTranslation.find({ tenantId, niche }).lean();
    const tenantKeys = tenantCats.map(c => c.key);
    const globalCats = await CategoryTranslation.find({
      tenantId: null,
      niche,
      key: { $nin: tenantKeys }
    }).lean();
    res.json([...tenantCats, ...globalCats]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать категорию (всегда привязывается к тенанту)
router.post('/', authTenant, async (req, res) => {
  try {
    const { key, name, description, translations, icon, niche, layout, coverImage, cardBgColor } = req.body;
    const tenantId = req.tenantId;

    let category = await CategoryTranslation.findOne({ key, tenantId });
    if (category) {
      return res.status(409).json({ error: 'Category with this key already exists for your tenant.' });
    }

    category = new CategoryTranslation({
      key,
      tenantId,
      name: name || key,
      description: description || '',
      translations: translations || {},
      icon: icon || '',
      niche: niche || 'food',
      layout: layout || 'grid-3',
      coverImage: coverImage || '',
      cardBgColor: cardBgColor || '',
      imageAspectRatio: imageAspectRatio || '1/1',
  productImageAspectRatio: productImageAspectRatio || '1/1',
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить категорию по ID
router.put('/:id', authTenant, async (req, res) => {
  try {
    const { name, description, icon, layout, niche, coverImage, cardBgColor, imageAspectRatio, productImageAspectRatio } = req.body;
    const tenantId = req.tenantId;

    let category = await CategoryTranslation.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (imageAspectRatio !== undefined) category.imageAspectRatio = imageAspectRatio;
    if (productImageAspectRatio !== undefined) category.productImageAspectRatio = productImageAspectRatio;

    // Клонирование глобальной категории при редактировании
    if (category.tenantId === null || category.tenantId === undefined) {
      let tenantCategory = await CategoryTranslation.findOne({ key: category.key, tenantId: tenantId });
      if (!tenantCategory) {
        tenantCategory = new CategoryTranslation({
          key: category.key,
          tenantId: tenantId,
          name: name !== undefined ? name : category.name,
          description: description !== undefined ? description : category.description,
          icon: icon !== undefined ? icon : category.icon,
          niche: niche !== undefined ? niche : category.niche,
          layout: layout !== undefined ? layout : category.layout,
          coverImage: coverImage !== undefined ? coverImage : category.coverImage,
          cardBgColor: cardBgColor !== undefined ? cardBgColor : category.cardBgColor,
          translations: category.translations,
          imageAspectRatio: imageAspectRatio || '1/1',
          productImageAspectRatio : productImageAspectRatio || '1/1',
        });
        await tenantCategory.save();
        return res.json(tenantCategory);
      } else {
        category = tenantCategory;
      }
    }

    if (category.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden: This category belongs to another tenant.' });
    }

    // Обновляем поля
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;   // <-- ВОТ ЭТО ДОБАВИЛИ
    if (icon !== undefined) category.icon = icon;
    if (layout !== undefined) category.layout = layout;
    if (niche !== undefined) category.niche = niche;
    if (coverImage !== undefined) category.coverImage = coverImage;
    if (cardBgColor !== undefined) category.cardBgColor = cardBgColor;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error('Error saving category:', err);
    res.status(500).json({ error: err.message });
  }
});

// Удалить категорию по ID
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const result = await CategoryTranslation.deleteOne({ _id: req.params.id, tenantId: tenantId });
    if (result.deletedCount === 0) {
      return res.status(403).json({ error: 'Cannot delete global category or category not found.' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Поиск категорий для автодополнения
router.get('/suggest', authTenant, async (req, res) => {
  try {
    const { q, niche } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const regex = new RegExp(q, 'i');
    const query = {
      $or: [{ key: regex }, { name: regex }],
      tenantId: null,
      niche: niche || 'food'
    };
    const categories = await CategoryTranslation.find(query).limit(8).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;