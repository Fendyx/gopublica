const express = require('express');
const router = express.Router();
const CategoryTranslation = require('../../models/CategoryTranslation');
const authTenant = require('../../middleware/authTenant');

// Получить доступные категории для ресторана
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    // Все категории, которые либо общие (addedByTenants пуст), либо уже привязаны к этому тенанту
    const categories = await CategoryTranslation.find({
      $or: [
        { addedByTenants: { $size: 0 } },
        { addedByTenants: tenantId },
      ],
    }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать или обновить перевод категории (когда админ добавил свою)
router.post('/', authTenant, async (req, res) => {
  try {
    const { key, translations } = req.body;
    const tenantId = req.tenantId;

    let category = await CategoryTranslation.findOne({ key });
    if (category) {
      // Обновляем переводы (дополняем, а не перезаписываем)
      if (translations) {
        for (const lang of Object.keys(translations)) {
          category.translations.set(lang, translations[lang]);
        }
      }
      // Добавляем tenantId, если его ещё нет
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
      });
      await category.save();
    }
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Поиск категорий для автодополнения (опционально, можно позже)
// Поиск категорий для автодополнения
// Поиск категорий для автодополнения
router.get('/suggest', authTenant, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const regex = new RegExp(q, 'i');

    // Поддерживаемые языки – важно, чтобы они совпадали с фронтом
    const LANGS = ['pl', 'en', 'de', 'ru', 'es', 'ua'];

    // Строим условия поиска: ключ, основное название и каждый перевод
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