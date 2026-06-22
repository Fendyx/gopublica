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
      // Если тенант не указан, возвращаем только глобальные
      const globals = await CategoryTranslation.find({ tenantId: null, niche }).lean();
      return res.json(globals);
    }

    // 1. Находим все категории, принадлежащие этому тенанту
    const tenantCats = await CategoryTranslation.find({ tenantId, niche }).lean();
    const tenantKeys = tenantCats.map(c => c.key);

    // 2. Находим глобальные категории, ключей которых НЕТ у этого тенанта
    const globalCats = await CategoryTranslation.find({
      tenantId: null,
      niche,
      key: { $nin: tenantKeys } // Исключаем ключи, которые уже есть у тенанта
    }).lean();

    // 3. Объединяем их (локальные + глобальные без дубликатов)
    const result = [...tenantCats, ...globalCats];

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать категорию (всегда привязывается к тенанту)
router.post('/', authTenant, async (req, res) => {
  try {
    // ДОБАВЛЕНО cardBgColor
    const { key, name, translations, icon, niche, layout, coverImage, cardBgColor } = req.body;
    const tenantId = req.tenantId;

    // Проверяем, нет ли уже такой категории у этого тенанта
    let category = await CategoryTranslation.findOne({ key, tenantId });
    if (category) {
      return res.status(409).json({ error: 'Category with this key already exists for your tenant.' });
    }

    category = new CategoryTranslation({
      key,
      tenantId, // Привязываем к тенанту
      name: name || key,
      translations: translations || {},
      icon: icon || '',
      niche: niche || 'food',
      layout: layout || 'grid-3',
      coverImage: coverImage || '',
      cardBgColor: cardBgColor || '' // <--- СОХРАНЯЕМ ЦВЕТ
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
    // ДОБАВЛЕНО cardBgColor
    const { name, icon, layout, niche, coverImage, cardBgColor } = req.body;
    const tenantId = req.tenantId;

    let category = await CategoryTranslation.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // МАГИЯ КЛОНИРОВАНИЯ: Если категория глобальная (tenantId: null),
    // мы должны найти или создать локальную копию для этого тенанта.
    if (category.tenantId === null || category.tenantId === undefined) {
      
      // Ищем, нет ли уже копии у этого тенанта
      let tenantCategory = await CategoryTranslation.findOne({ key: category.key, tenantId: tenantId });
      
      if (!tenantCategory) {
        // Если копии нет — создаем
        tenantCategory = new CategoryTranslation({
          key: category.key,
          tenantId: tenantId,
          name: name !== undefined ? name : category.name,
          icon: icon !== undefined ? icon : category.icon,
          niche: niche !== undefined ? niche : category.niche,
          layout: layout !== undefined ? layout : category.layout,
          coverImage: coverImage !== undefined ? coverImage : category.coverImage,
          cardBgColor: cardBgColor !== undefined ? cardBgColor : category.cardBgColor, // <--- СОХРАНЯЕМ ЦВЕТ
          translations: category.translations
        });
        await tenantCategory.save();
        return res.json(tenantCategory);
      } else {
        // Если копия уже есть — переключаемся на неё, чтобы просто обновить
        category = tenantCategory;
      }
    }

    // Если категория принадлежит другому тенанту — запрет
    if (category.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden: This category belongs to another tenant.' });
    }

    // Обновляем поля
    if (name !== undefined) category.name = name;
    if (icon !== undefined) category.icon = icon;
    if (layout !== undefined) category.layout = layout;
    if (niche !== undefined) category.niche = niche;
    if (coverImage !== undefined) category.coverImage = coverImage;
    if (cardBgColor !== undefined) category.cardBgColor = cardBgColor; // <--- СОХРАНЯЕМ ЦВЕТ

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
    // Удаляем только если она принадлежит этому тенанту (нельзя удалить глобальную)
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
      tenantId: null, // При создании предлагаем только глобальные словарные категории
      niche: niche || 'food'
    };

    const categories = await CategoryTranslation.find(query).limit(8).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;