const express = require('express');
const router = express.Router();
const ProductAttribute = require('../../models/ecommerce/ProductAttribute');
const MenuItem = require('../../models/food/MenuItem');
const authTenant = require('../../middleware/auth/tenant');
const slugify = require('../../utils/slugify');

// ── PUBLIC: List attributes (filter by type, tenantId) ──
router.get('/', async (req, res) => {
  try {
    const { tenantId, type, groupId, active } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const query = { tenantId };
    if (type) query.type = type;
    if (groupId) query.groupId = groupId;
    if (active !== undefined) query.isActive = active === 'true';

    const attributes = await ProductAttribute.find(query)
      .sort({ type: 1, name: 1 })
      .lean();
    res.json(attributes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC: List attributes grouped by type ──
router.get('/tree', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const attributes = await ProductAttribute.find({ tenantId, isActive: true })
      .sort({ type: 1, name: 1 })
      .lean();

    // Group by type
    const tree = {};
    for (const attr of attributes) {
      if (!tree[attr.type]) tree[attr.type] = [];
      tree[attr.type].push(attr);
    }
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC: Search/suggest attributes (for autocomplete) ──
router.get('/suggest', async (req, res) => {
  try {
    const { tenantId, type, q } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const query = { tenantId, isActive: true };
    if (type) query.type = type;
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { slug: { $regex: escaped, $options: 'i' } },
      ];
    }

    const attributes = await ProductAttribute.find(query)
      .sort({ productCount: -1, name: 1 })
      .limit(50)
      .lean();
    res.json(attributes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Create attribute ──
router.post('/', authTenant, async (req, res) => {
  try {
    const { type, groupId, name, translations, description, image } = req.body;
    const tenantId = req.tenantId;

    if (!type || !name) {
      return res.status(400).json({ error: 'type and name are required' });
    }

    let slug = slugify(name);

    // Ensure slug uniqueness within tenant+type
    const existing = await ProductAttribute.findOne({ tenantId, type, slug });
    if (existing) {
      // Append a suffix
      let counter = 2;
      while (await ProductAttribute.findOne({ tenantId, type, slug: `${slug}-${counter}` })) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    const attribute = new ProductAttribute({
      tenantId,
      type,
      groupId: groupId || null,
      name: name.trim(),
      slug,
      translations: translations || {},
      description: description || '',
      image: image || '',
    });

    await attribute.save();
    res.status(201).json(attribute);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Attribute with this slug already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Update attribute ──
router.put('/:id', authTenant, async (req, res) => {
  try {
    const { name, translations, description, image, isActive, slug: newSlug } = req.body;
    const tenantId = req.tenantId;

    const attribute = await ProductAttribute.findById(req.params.id);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found' });
    if (attribute.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });

    if (name !== undefined) attribute.name = name.trim();
    if (translations !== undefined) attribute.translations = translations;
    if (description !== undefined) attribute.description = description;
    if (image !== undefined) attribute.image = image;
    if (isActive !== undefined) attribute.isActive = isActive;

    // Handle slug change
    if (newSlug !== undefined && newSlug !== attribute.slug) {
      const slug = slugify(newSlug);
      const conflict = await ProductAttribute.findOne({
        tenantId,
        type: attribute.type,
        slug,
        _id: { $ne: attribute._id },
      });
      if (conflict) {
        return res.status(409).json({ error: 'Slug already in use' });
      }
      attribute.slug = slug;
    }

    await attribute.save();
    res.json(attribute);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Attribute with this slug already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Delete attribute ──
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const attribute = await ProductAttribute.findById(req.params.id);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found' });
    if (attribute.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });

    // Check if any products reference this attribute
    const referencingProduct = await MenuItem.findOne({
      tenantId,
      'attributeRefs.attributeId': attribute._id.toString(),
    }).lean();

    if (referencingProduct) {
      return res.status(409).json({
        error: 'Cannot delete: attribute is referenced by products. Remove references first.',
      });
    }

    await ProductAttribute.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
