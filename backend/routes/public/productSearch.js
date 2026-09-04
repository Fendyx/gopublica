const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MenuItem = require('../../models/food/MenuItem');
const ProductAttribute = require('../../models/ecommerce/ProductAttribute');

// ── GET /api/public/products/search?tenantId=X&q=query&branchId=Y ──
router.get('/', async (req, res) => {
  try {
    const { tenantId, q, branchId, limit = '20' } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    if (!q || !q.trim()) return res.json([]);

    const query = q.trim();
    const maxResults = Math.min(parseInt(limit, 10) || 20, 50);

    // 1. Find matching attribute IDs (by name/slug regex)
    const matchingAttributes = await ProductAttribute.find({
      tenantId,
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();

    const matchingAttrIds = matchingAttributes.map((a) => a._id.toString());

    // 2. Build the product query
    const productQuery = {
      tenantId,
      productType: { $in: ['physical_product', 'digital'] },
      $or: [
        // Direct field matches
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        // Freeform attributes match
        { 'attributes.key': { $regex: query, $options: 'i' } },
        { 'attributes.value': { $regex: query, $options: 'i' } },
        // Managed attribute refs match
        ...(matchingAttrIds.length > 0
          ? [{ 'attributeRefs.attributeId': { $in: matchingAttrIds } }]
          : []),
      ],
    };

    // Optionally filter by branch
    if (branchId) {
      productQuery.$and = [
        { $or: [{ branchId }, { branchId: null }] },
      ];
    }

    const products = await MenuItem.find(productQuery)
      .sort({ name: 1 })
      .limit(maxResults)
      .lean();

    res.json(products);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
