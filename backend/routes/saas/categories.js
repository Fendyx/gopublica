const express = require('express');
const router = express.Router();
const CategoryTranslation = require('../../models/CategoryTranslation');
const authTenant = require('../../middleware/authTenant');

// ПУБЛИЧНЫЙ РОУТ: Получить доступные категории (свои + глобальные)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const niche = req.query.niche || 'food';
    if (!tenantId) {
      const globals = await CategoryTranslation.find({ tenantId: null, niche })
        .sort({ order: 1, name: 1 })
        .lean();
      return res.json(globals);
    }
    const tenantCats = await CategoryTranslation.find({ tenantId, niche })
      .sort({ order: 1, name: 1 })
      .lean();
    const tenantKeys = tenantCats.map(c => c.key);
    const globalCats = await CategoryTranslation.find({
      tenantId: null,
      niche,
      key: { $nin: tenantKeys }
    })
      .sort({ order: 1, name: 1 })
      .lean();
    res.json([...tenantCats, ...globalCats]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать категорию
router.post('/', authTenant, async (req, res) => {
  try {
    const { key, name, description, translations, icon, niche, layout, coverImage,
            cardBgColor, imageAspectRatio, productImageAspectRatio, order, carouselAutoplay } = req.body;
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
      carouselAutoplay: carouselAutoplay || false
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
    for (let i = 0; i < orderedIds.length; i++) {
      await CategoryTranslation.findOneAndUpdate(
        { _id: orderedIds[i], tenantId },
        { order: i }
      );
    }
    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить категорию по ID
router.put('/:id', authTenant, async (req, res) => {
  try {
    const { name, description, icon, layout, niche, coverImage, cardBgColor,
            imageAspectRatio, productImageAspectRatio, order, carouselAutoplay } = req.body;
    const tenantId = req.tenantId;
    let category = await CategoryTranslation.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (imageAspectRatio !== undefined) category.imageAspectRatio = imageAspectRatio;
    if (productImageAspectRatio !== undefined) category.productImageAspectRatio = productImageAspectRatio;
    if (order !== undefined) category.order = order;
    if (carouselAutoplay !== undefined) category.carouselAutoplay = carouselAutoplay;

    // Клонирование глобальной категории при редактировании
    if (category.tenantId === null || category.tenantId === undefined) {
      let tenantCategory = await CategoryTranslation.findOne({ key: category.key, tenantId });
      if (!tenantCategory) {
        tenantCategory = new CategoryTranslation({
          key: category.key, tenantId,
          name: name !== undefined ? name : category.name,
          description: description !== undefined ? description : category.description,
          icon: icon !== undefined ? icon : category.icon,
          niche: niche !== undefined ? niche : category.niche,
          layout: layout !== undefined ? layout : category.layout,
          coverImage: coverImage !== undefined ? coverImage : category.coverImage,
          cardBgColor: cardBgColor !== undefined ? cardBgColor : category.cardBgColor,
          translations: category.translations,
          imageAspectRatio: imageAspectRatio || '1/1',
          productImageAspectRatio: productImageAspectRatio || '1/1',
          order: order !== undefined ? order : category.order,
          carouselAutoplay: carouselAutoplay !== undefined ? carouselAutoplay : category.carouselAutoplay
        });
        await tenantCategory.save();
        return res.json(tenantCategory);
      } else {
        category = tenantCategory;
      }
    }

    if (category.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
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

// Поиск категорий
router.get('/suggest', authTenant, async (req, res) => {
  try {
    const { q, niche } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const regex = new RegExp(q, 'i');
    const categories = await CategoryTranslation.find({
      $or: [{ key: regex }, { name: regex }],
      tenantId: null,
      niche: niche || 'food'
    }).limit(8).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;