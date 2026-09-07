const express = require('express');
const router = express.Router();
const MenuItem = require('../../models/food/MenuItem');

// ── GET /api/public/products/related?productId=X&tenantId=Y&limit=5 ──
router.get('/', async (req, res) => {
  try {
    const { productId, tenantId, limit = '5' } = req.query;
    if (!productId || !tenantId) {
      return res.status(400).json({ error: 'productId and tenantId are required' });
    }

    const maxResults = Math.min(parseInt(limit, 10) || 5, 20);

    // 1. Load the target product
    const target = await MenuItem.findById(productId).lean();
    if (!target) return res.status(404).json({ error: 'Product not found' });

    // 2. Get its attribute refs
    const refs = target.attributeRefs || [];
    if (refs.length === 0) {
      // No attribute refs - fall back to same category products
      const fallback = await MenuItem.find({
        tenantId,
        _id: { $ne: productId },
        productType: { $in: ['physical_product', 'digital'] },
        $or: [
          { categoryKey: target.categoryKey || '' },
          { category: target.category || '' },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(maxResults)
        .lean();
      return res.json(fallback);
    }

    // 3. Find products sharing attributeRefs (weighted scoring)
    const refAttrIds = refs.map((r) => r.attributeId);

    const candidates = await MenuItem.find({
      tenantId,
      _id: { $ne: productId },
      productType: { $in: ['physical_product', 'digital'] },
      'attributeRefs.attributeId': { $in: refAttrIds },
    })
      .limit(100) // fetch more, then rank in-memory
      .lean();

    // 4. Score and rank candidates
    const scored = candidates.map((product) => {
      let score = 0;
      const prodRefs = product.attributeRefs || [];

      for (const ref of refs) {
        for (const prodRef of prodRefs) {
          if (ref.attributeId === prodRef.attributeId) {
            // Weight by attribute type: author > series > genre > publisher > language > custom
            const weights = { author: 10, series: 8, genre: 5, publisher: 3, language: 2, custom: 1 };
            score += weights[ref.type] || 1;
          }
        }
      }

      // Bonus for same category
      if (product.categoryKey && product.categoryKey === target.categoryKey) {
        score += 2;
      }

      return { ...product, _score: score };
    });

    // 5. Sort by score, take top N
    scored.sort((a, b) => b._score - a._score);
    const results = scored.slice(0, maxResults).map(({ _score, ...product }) => product);

    res.json(results);
  } catch (err) {
    console.error('Related products error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
