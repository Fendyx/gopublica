const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MenuItem = require('../../models/MenuItem');
const TenantSettings = require('../../models/TenantSettings');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/authTenant');
const { enforceModuleAccess } = require('../../services/moduleAccess');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// Публичный роут: получение меню
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId, branchSlug } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    let query = { tenantId };
    if (resolvedBranchId) {
      query = { tenantId, $or: [{ branchId: resolvedBranchId }, { branchId: null }] };
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
    const tenant = await TenantSettings.findOne({ tenantId: req.tenantId }).lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    if (!enforceModuleAccess(tenant, 'menu', res)) return;

    const {
      name, description, price, category, categoryKey, image,
      isVegetarian, isSpicy, order, translations, branchId,
      productType, hasPersonalization, modifierGroups,
      sku, stock, compareAtPrice, images, weight, weightUnit,
      dimensions, tags, variants, isFeatured   // 👈 добавлено
    } = req.body;

    const newItem = new MenuItem({
      tenantId: req.tenantId,
      name, description, price, category, categoryKey, image,
      isVegetarian, isSpicy, order, translations,
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
      isFeatured: isFeatured || false   // 👈 добавлено
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
    const tenant = await TenantSettings.findOne({ tenantId: req.tenantId }).lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    if (!enforceModuleAccess(tenant, 'menu', res)) return;

    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Блюдо не найдено' });
    if (item.tenantId !== req.tenantId) return res.status(403).json({ error: 'Доступ запрещён' });

    const {
      name, description, price, category, categoryKey, image,
      isVegetarian, isSpicy, order, translations, branchId,
      productType, hasPersonalization, modifierGroups,
      sku, stock, compareAtPrice, images: imgs, weight, weightUnit,
      dimensions, tags, variants, isFeatured   // 👈 добавлено
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
    if (isFeatured !== undefined) item.isFeatured = isFeatured;   // 👈 добавлено

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const tenant = await TenantSettings.findOne({ tenantId: req.tenantId }).lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    if (!enforceModuleAccess(tenant, 'menu', res)) return;

    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Блюдо не найдено' });
    if (item.tenantId !== req.tenantId) return res.status(403).json({ error: 'Доступ запрещён' });

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;