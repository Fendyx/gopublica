const express = require('express');
const router = express.Router();
const MenuItem = require('../../models/food/MenuItem');
const CategoryTranslation = require('../../models/food/CategoryTranslation');
const ProductAttribute = require('../../models/ecommerce/ProductAttribute');

// ── GET /api/public/omni-search?tenantId=X&q=query&branchId=Y&locale=pl ──────
// Aggregated search across products, categories, and attributes.
// Returns structured results grouped by entity type.
router.get('/', async (req, res) => {
  try {
    const { tenantId, q, branchId, locale = 'pl', limit: rawLimit } = req.query;

    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const query = (q || '').trim();
    if (query.length < 2) {
      return res.json({ products: [], categories: [], attributes: [] });
    }

    const maxProducts    = Math.min(parseInt(rawLimit, 10) || 8, 20);
    const maxCategories  = 5;
    const maxAttributes  = 5;

    const regex = new RegExp(query, 'i');

    // ── Parallel queries across 3 collections ──────────────────────────────
    const [products, categories, attributes] = await Promise.all([
      // 1. Products (physical / digital)
      findProducts(tenantId, regex, branchId, maxProducts),
      // 2. Categories
      findCategories(tenantId, regex, locale, maxCategories),
      // 3. Attributes / Brands
      findAttributes(tenantId, regex, locale, maxAttributes),
    ]);

    res.json({ products, categories, attributes });
  } catch (err) {
    console.error('Omni-search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findProducts(tenantId, regex, branchId, limit) {
  // First, find attribute IDs whose name/slug matches the query
  const matchingAttrs = await ProductAttribute.find({
    tenantId,
    isActive: true,
    $or: [
      { name: regex },
      { slug: regex },
    ],
  })
    .select('_id')
    .lean();

  const matchingAttrIds = matchingAttrs.map((a) => a._id.toString());

  const productQuery = {
    tenantId,
    productType: { $in: ['physical_product', 'digital'] },
    status: 'published',
    $or: [
      { name: regex },
      { description: regex },
      { sku: regex },
      { tags: { $in: [regex] } },
      { 'attributes.key': regex },
      { 'attributes.value': regex },
      ...(matchingAttrIds.length > 0
        ? [{ 'attributeRefs.attributeId': { $in: matchingAttrIds } }]
        : []),
    ],
  };

  if (branchId) {
    productQuery.$and = [{ $or: [{ branchId }, { branchId: null }] }];
  }

  const items = await MenuItem.find(productQuery)
    .select('name price compareAtPrice image images categoryKey slug')
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  return items.map((p) => ({
    _id: p._id,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice || null,
    image: p.image || (Array.isArray(p.images) && p.images[0]) || '',
    categoryKey: p.categoryKey || '',
    slug: p.slug || '',
  }));
}

async function findCategories(tenantId, regex, locale, limit) {
  const query = {
    tenantId,
    $or: [
      { name: regex },
      { [`translations.${locale}.name`]: regex },
    ],
  };

  const items = await CategoryTranslation.find(query)
    .select('key name icon coverImage translations')
    .sort({ order: 1, name: 1 })
    .limit(limit)
    .lean();

  return items.map((c) => ({
    _id: c._id,
    key: c.key,
    name: c.translations?.[locale]?.name || c.name || c.key,
    icon: c.icon || '',
    coverImage: c.coverImage || '',
  }));
}

async function findAttributes(tenantId, regex, locale, limit) {
  const query = {
    tenantId,
    isActive: true,
    $or: [
      { name: regex },
      { slug: regex },
      { [`translations.${locale}.name`]: regex },
    ],
  };

  const items = await ProductAttribute.find(query)
    .select('name slug type image productCount translations')
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  return items.map((a) => ({
    _id: a._id,
    name: a.translations?.[locale]?.name || a.name,
    slug: a.slug,
    type: a.type,
    image: a.image || '',
    productCount: a.productCount || 0,
  }));
}

module.exports = router;
