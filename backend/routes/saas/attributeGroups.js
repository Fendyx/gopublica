const express = require('express');
const router = express.Router();
const AttributeGroup = require('../../models/ecommerce/AttributeGroup');
const ProductAttribute = require('../../models/ecommerce/ProductAttribute');
const authTenant = require('../../middleware/auth/tenant');
const slugify = require('../../utils/slugify');

// ── PUBLIC: List all groups for a tenant ──
router.get('/', async (req, res) => {
  try {
    const { tenantId, active } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const query = { tenantId };
    if (active !== undefined) query.isActive = active === 'true';

    const groups = await AttributeGroup.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC: Single group with its attributes ──
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const group = await AttributeGroup.findOne({ _id: req.params.id, tenantId }).lean();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const attributes = await ProductAttribute.find({
      tenantId,
      $or: [{ groupId: group._id.toString() }, { type: group.slug }],
    })
      .sort({ name: 1 })
      .lean();

    res.json({ ...group, attributes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC: Resolve attribute by group slug + attribute slug ──
router.get('/resolve/:groupSlug/:attrSlug', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { groupSlug, attrSlug } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const group = await AttributeGroup.findOne({ tenantId, slug: groupSlug }).lean();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const attribute = await ProductAttribute.findOne({
      tenantId,
      $or: [{ groupId: group._id.toString() }, { type: group.slug }],
      slug: attrSlug,
    }).lean();

    if (!attribute) return res.status(404).json({ error: 'Attribute not found' });

    res.json({ group, attribute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Create group ──
router.post('/', authTenant, async (req, res) => {
  try {
    const { name, icon, translations, sortOrder } = req.body;
    const tenantId = req.tenantId;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    let slug = slugify(name);

    // Ensure slug uniqueness within tenant
    const existing = await AttributeGroup.findOne({ tenantId, slug });
    if (existing) {
      let counter = 2;
      while (await AttributeGroup.findOne({ tenantId, slug: `${slug}-${counter}` })) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    const group = new AttributeGroup({
      tenantId,
      name: name.trim(),
      slug,
      icon: icon || '',
      sortOrder: sortOrder ?? 0,
      translations: translations || {},
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Group with this slug already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Update group ──
router.put('/:id', authTenant, async (req, res) => {
  try {
    const { name, icon, translations, isActive, sortOrder, slug: newSlug } = req.body;
    const tenantId = req.tenantId;

    const group = await AttributeGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });

    if (name !== undefined) group.name = name.trim();
    if (icon !== undefined) group.icon = icon;
    if (translations !== undefined) group.translations = translations;
    if (isActive !== undefined) group.isActive = isActive;
    if (sortOrder !== undefined) group.sortOrder = sortOrder;

    // Handle slug change
    if (newSlug !== undefined && newSlug !== group.slug) {
      const slug = slugify(newSlug);
      const conflict = await AttributeGroup.findOne({
        tenantId,
        slug,
        _id: { $ne: group._id },
      });
      if (conflict) {
        return res.status(409).json({ error: 'Slug already in use' });
      }

      const oldSlug = group.slug;
      group.slug = slug;

      // Also update all attributes that reference the old type/slug
      await ProductAttribute.updateMany(
        { tenantId, type: oldSlug },
        { $set: { type: slug } },
      );
    }

    await group.save();
    res.json(group);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Slug already in use' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Reorder groups ──
router.post('/reorder', authTenant, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const tenantId = req.tenantId;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }

    const updates = orderedIds.map((id, index) =>
      AttributeGroup.updateOne(
        { _id: id, tenantId },
        { $set: { sortOrder: index } },
      ),
    );

    await Promise.all(updates);
    res.json({ message: 'Reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Delete group ──
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const group = await AttributeGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.tenantId !== tenantId) return res.status(403).json({ error: 'Forbidden' });

    // Check if any attributes reference this group
    const referencingAttr = await ProductAttribute.findOne({
      tenantId,
      $or: [{ groupId: group._id.toString() }, { type: group.slug }],
    }).lean();

    if (referencingAttr) {
      return res.status(409).json({
        error: 'Cannot delete: group has attributes. Remove or reassign them first.',
      });
    }

    await AttributeGroup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
