const express = require('express');
const router = express.Router();
const BeautyCategory = require('../../models/beauty/Category');
const authTenant = require('../../middleware/authTenant');

// Получить категории для тенанта с учётом businessType
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { businessType } = req.query; // необязательный фильтр
    let filter = {
      $or: [
        { addedByTenants: { $size: 0 } },
        { addedByTenants: tenantId },
      ],
    };
    if (businessType) {
      filter.businessType = { $in: [businessType, 'all'] };
    }
    const categories = await BeautyCategory.find(filter).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать или обновить категорию
router.post('/', authTenant, async (req, res) => {
  try {
    const { key, name, translations, businessType } = req.body;
    const tenantId = req.tenantId;

    let category = await BeautyCategory.findOne({ key });
    if (category) {
      if (translations) {
        for (const lang of Object.keys(translations)) {
          category.translations.set(lang, translations[lang]);
        }
      }
      if (!category.addedByTenants.includes(tenantId)) {
        category.addedByTenants.push(tenantId);
      }
      await category.save();
    } else {
      category = new BeautyCategory({
        key,
        name: name || key,
        translations: translations || {},
        businessType: businessType || 'all',
        addedByTenants: [tenantId],
      });
      await category.save();
    }
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Поиск категорий для автодополнения
router.get('/suggest', authTenant, async (req, res) => {
  try {
    const { q, businessType } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const regex = new RegExp(q, 'i');
    const LANGS = ['pl', 'en', 'de', 'ru', 'es', 'ua'];
    const orConditions = [
      { key: regex },
      { name: regex },
      ...LANGS.map(lang => ({ [`translations.${lang}`]: regex }))
    ];

    let filter = { $or: orConditions };
    if (businessType) {
      filter.businessType = { $in: [businessType, 'all'] };
    }

    const categories = await BeautyCategory.find(filter).limit(8).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;