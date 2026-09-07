const express = require('express');
const router = express.Router();
const PlatformProduct = require('../../models/platform/PlatformProduct');
const authTenant = require('../../middleware/auth/tenant');
const auth = require('../../middleware/auth/jwt');

// ─── Tenant-facing: list products filtered by niche ────────────────────────
router.get('/', authTenant, async (req, res) => {
  try {
    const { niche, category } = req.query;
    const filter = { isActive: true };

    // Filter by tenant's niche - include products targeting 'all' or the specific niche
    if (niche) {
      filter.$or = [
        { targetNiches: 'all' },
        { targetNiches: niche },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const products = await PlatformProduct.find(filter).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error('GET /api/platform/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: list all products (no niche filter) ────────────────────────────
router.get('/all', auth, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const products = await PlatformProduct.find(filter).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error('GET /api/platform/products/all error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: get single product ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await PlatformProduct.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: create product ─────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, titleI18n, description, descriptionI18n, price, currency, photo, gallery, specs, targetNiches, category, stock } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    const product = new PlatformProduct({
      title,
      titleI18n: titleI18n || {},
      description: description || '',
      descriptionI18n: descriptionI18n || {},
      price,
      currency: currency || 'EUR',
      photo: photo || '',
      gallery: gallery || [],
      specs: specs || [],
      targetNiches: targetNiches || ['all'],
      category: category || 'hardware',
      stock: stock ?? -1,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/platform/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: update product ─────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await PlatformProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const allowed = ['title', 'titleI18n', 'description', 'descriptionI18n', 'price', 'currency', 'photo', 'gallery', 'specs', 'targetNiches', 'category', 'isActive', 'stock'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('PUT /api/platform/products/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: delete product (soft delete) ───────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await PlatformProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.isActive = false;
    await product.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
