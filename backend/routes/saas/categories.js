const express = require('express');
const router = express.Router();
const CategoryTranslation = require('../../models/food/CategoryTranslation');
const authTenant = require('../../middleware/auth/tenant');

// ── Helper: build nested category tree from flat list ──
function buildTree(categories, parentKey = null) {
  return categories
    .filter(c => (c.parentCategoryKey || null) === parentKey)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name))
    .map(c => ({
      ...c,
      children: buildTree(categories, c.key),
    }));
}

// ПУБЛИЧНЫЙ РОУТ: Получить категории тенанта
router.get('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const niche = req.query.niche || 'food';
    const parentKey = req.query.parentKey || null;
    const treeMode = req.query.tree === 'true';

    if (!tenantId) {
      return res.json([]);
    }

    // Only return categories owned by this tenant (global/tenantId:null categories are no longer used)
    const cats = await CategoryTranslation.find({ tenantId, niche })
      .sort({ order: 1, name: 1 })
      .lean();

    if (parentKey) {
      return res.json(cats.filter(c => (c.parentCategoryKey || null) === parentKey));
    }
    if (treeMode) return res.json(buildTree(cats));
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать категорию
router.post('/', authTenant, async (req, res) => {
  try {
    const { key, name, description, translations, icon, niche, layout, coverImage,
            cardBgColor, imageAspectRatio, productImageAspectRatio, order, carouselAutoplay,
            productCardVariant, productCardWidth, parentCategoryKey } = req.body;
    const tenantId = req.tenantId;

    let category = await CategoryTranslation.findOne({ key, tenantId });
    if (category) return res.status(409).json({ error: 'Category already exists' });

    category = new CategoryTranslation({
      key, tenantId,
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
      order: order || 0,
      carouselAutoplay: carouselAutoplay || false,
      productCardVariant: productCardVariant || null,
      productCardWidth: productCardWidth || 'default',
      parentCategoryKey: parentCategoryKey || null,
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Переупорядочивание категорий – размещён ДО PUT /:id
router.put('/reorder', authTenant, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const tenantId = req.tenantId;

    // Bulk update using a single bulkWrite (fixes N+1)
    await CategoryTranslation.bulkWrite(
      orderedIds.map((id, i) => ({
        updateOne: {
          filter: { _id: id, tenantId },
          update: { order: i },
        },
      }))
    );

    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить категорию по ID
router.put('/:id', authTenant, async (req, res) => {
  try {
    const { name, description, translations, icon, layout, niche, coverImage, cardBgColor,
            imageAspectRatio, productImageAspectRatio, order, carouselAutoplay,
            productCardVariant, productCardWidth, parentCategoryKey } = req.body;
    const tenantId = req.tenantId;
    let category = await CategoryTranslation.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (imageAspectRatio !== undefined) category.imageAspectRatio = imageAspectRatio;
    if (productImageAspectRatio !== undefined) category.productImageAspectRatio = productImageAspectRatio;
    if (order !== undefined) category.order = order;
    if (carouselAutoplay !== undefined) category.carouselAutoplay = carouselAutoplay;
    if (productCardVariant !== undefined) category.productCardVariant = productCardVariant || null;
    if (productCardWidth !== undefined) category.productCardWidth = productCardWidth;

    if (category.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (layout !== undefined) category.layout = layout;
    if (niche !== undefined) category.niche = niche;
    if (coverImage !== undefined) category.coverImage = coverImage;
    if (cardBgColor !== undefined) category.cardBgColor = cardBgColor;
    if (parentCategoryKey !== undefined) category.parentCategoryKey = parentCategoryKey || null;
    if (translations !== undefined) category.translations = translations;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error('Error saving category:', err);
    res.status(500).json({ error: err.message });
  }
});

// Удалить категорию
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const result = await CategoryTranslation.deleteOne({ _id: req.params.id, tenantId: req.tenantId });
    if (result.deletedCount === 0) return res.status(403).json({ error: 'Cannot delete' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Поиск категорий тенанта
router.get('/suggest', authTenant, async (req, res) => {
  try {
    const { q, niche } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const regex = new RegExp(q, 'i');
    const categories = await CategoryTranslation.find({
      $or: [{ key: regex }, { name: regex }],
      tenantId: req.tenantId,
      niche: niche || 'food'
    }).limit(8).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;