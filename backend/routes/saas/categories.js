const express = require('express');
const router = express.Router();
const CategoryTranslation = require('../../models/CategoryTranslation');
const authTenant = require('../../middleware/authTenant');

// ПУБЛИЧНЫЙ РОУТ: Получить доступные категории
router.get('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;

    const orConditions = [
      { addedByTenants: { $size: 0 } }
    ];

    if (tenantId) {
      orConditions.push({ addedByTenants: tenantId });
    }

    const categories = await CategoryTranslation.find({
      $or: orConditions,
    }).lean();

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать или обновить категорию
router.post('/', authTenant, async (req, res) => {
  try {
    const { key, translations, icon } = req.body;
    const tenantId = req.tenantId;

    let category = await CategoryTranslation.findOne({ key });
    if (category) {
      if (translations) {
        for (const lang of Object.keys(translations)) {
          category.translations.set(lang, translations[lang]);
        }
      }
      if (icon !== undefined) category.icon = icon;
      if (!category.addedByTenants.includes(tenantId)) {
        category.addedByTenants.push(tenantId);
      }
      await category.save();
    } else {
      category = new CategoryTranslation({
        key,
        name: req.body.name || key,
        translations: translations || {},
        addedByTenants: [tenantId],
        icon: icon || '',
      });
      await category.save();
    }
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить иконку / переводы / название категории
router.patch('/:key', authTenant, async (req, res) => {
  try {
    const { name, translations, icon } = req.body;
    const update = {};

    if (name !== undefined) update.name = name;
    if (icon !== undefined) update.icon = icon;

    const category = await CategoryTranslation.findOne({ key: req.params.key });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (name !== undefined) category.name = name;
    if (icon !== undefined) category.icon = icon;

    if (translations) {
      for (const lang of Object.keys(translations)) {
        category.translations.set(lang, translations[lang]);
      }
    }

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Поиск категорий для автодополнения
router.get('/suggest', authTenant, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const regex = new RegExp(q, 'i');
    const LANGS = ['pl', 'en', 'de', 'ru', 'es', 'ua'];

    const orConditions = [
      { key: regex },
      { name: regex },
      ...LANGS.map(lang => ({ [`translations.${lang}`]: regex }))
    ];

    const categories = await CategoryTranslation.find({
      $or: orConditions,
    }).limit(8).lean();

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;