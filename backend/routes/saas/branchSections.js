const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BranchSection = require('../../models/BranchSection');
const BranchSectionItem = require('../../models/BranchSectionItem');
const Branch = require('../../models/Branch');
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/authTenant');
const checkBranch = require('../../middleware/checkBranch');
const { enforceModuleAccess } = require('../../services/moduleAccess');

// ============================================================
// MIDDLEWARE: Apply to all routes in this file
// ============================================================
router.use(authTenant);

// Helper: verify tenant has sections module enabled
async function verifyModuleAccess(req, res, next) {
  const tenant = await TenantSettings.findOne({ tenantId: req.tenantId }).lean();
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  if (!enforceModuleAccess(tenant, 'sections', res)) return;
  req.tenant = tenant;
  next();
}

router.use(verifyModuleAccess);

// ============================================================
// SECTION ROUTES
// ============================================================

// GET /?branchId=&branchSlug= — list all sections for a branch, sorted by order
router.get('/', checkBranch, async (req, res) => {
  try {
    const { branchId, branchSlug } = req.query;
    // Use resolved branch from middleware (supports both branchId and branchSlug)
    // If branchId is provided but is not a valid ObjectId, treat it as a slug
    let resolvedBranchId = branchId;
    if (resolvedBranchId && !mongoose.Types.ObjectId.isValid(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found for slug' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId && req.branch) {
      resolvedBranchId = req.branch._id;
    }
    if (!resolvedBranchId && !branchSlug) return res.status(400).json({ error: 'branchId or branchSlug is required' });

    const sections = await BranchSection.find({ tenantId: req.tenantId, branchId: resolvedBranchId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create a section
router.post('/', checkBranch, async (req, res) => {
  try {
    const { branchId, branchSlug, page = 'home', type, order, settings = {}, translations = {} } = req.body;

    // Use resolved branch from middleware (supports both branchId and branchSlug)
    // checkBranch middleware already resolved branchId (even if it was a slug) or branchSlug
    const resolvedBranchId = req.branch ? req.branch._id : (branchId || null);
    if (!resolvedBranchId && !branchSlug) return res.status(400).json({ error: 'branchId or branchSlug is required' });
    if (!type) return res.status(400).json({ error: 'type is required' });

    // Verify branch belongs to tenant (already done by checkBranch middleware, but double-check)
    const branch = req.branch || await Branch.findOne({ _id: resolvedBranchId, tenantId: req.tenantId });
    if (!branch) return res.status(403).json({ error: 'Access denied to this branch' });

    // Determine the next order value: use provided order, or append to the end
    let nextOrder;
    if (order !== undefined) {
      nextOrder = order;
    } else {
      const lastSection = await BranchSection.findOne({ branchId: branch._id }).sort({ order: -1 });
      nextOrder = lastSection ? lastSection.order + 1 : 0;
    }

    const section = new BranchSection({
      tenantId: req.tenantId,
      branchId: branch._id,
      page,
      type,
      order: nextOrder,
      settings,
      translations,
    });

    await section.save();
    res.status(201).json(section);
  } catch (err) {
    console.error('--- BRANCH SECTION SAVE ERROR ---', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /reorder — bulk update order field
router.put('/reorder', checkBranch, async (req, res) => {
  try {
    const { branchId, orderedIds } = req.body;
    // Use resolved branch from middleware (supports both branchId and branchSlug)
    const resolvedBranchId = req.branch ? req.branch._id : branchId;
    if (!resolvedBranchId) return res.status(400).json({ error: 'branchId is required' });
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

    // Verify branch belongs to tenant (already done by checkBranch middleware)
    const branch = req.branch || await Branch.findOne({ _id: resolvedBranchId, tenantId: req.tenantId });
    if (!branch) return res.status(403).json({ error: 'Access denied to this branch' });

    for (let i = 0; i < orderedIds.length; i++) {
      await BranchSection.findOneAndUpdate(
        { _id: orderedIds[i], tenantId: req.tenantId, branchId },
        { order: i }
      );
    }

    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /reorder-bulk — bulk update order field using updates array
// Expects: { updates: [{ _id, order }, ...] }
router.put('/reorder-bulk', async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates must be an array' });
    }

    for (const update of updates) {
      const { _id, order } = update;
      if (!_id || order === undefined) {
        return res.status(400).json({ error: 'Each update must have _id and order' });
      }

      // Ensure the section belongs to the current tenant for security
      const section = await BranchSection.findOne({ _id, tenantId: req.tenantId });
      if (!section) {
        return res.status(403).json({ error: `Access denied to section ${_id}` });
      }

      await BranchSection.findByIdAndUpdate(_id, { order });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Reorder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update a section
router.put('/:id', checkBranch, async (req, res) => {
  try {
    const section = await BranchSection.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    if (section.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    const { page, type, order, settings, translations, isActive } = req.body;

    if (page !== undefined) section.page = page;
    if (type !== undefined) section.type = type;
    if (order !== undefined) section.order = order;
    if (settings !== undefined) section.settings = settings;
    if (translations !== undefined) section.translations = translations;
    if (isActive !== undefined) section.isActive = isActive;

    await section.save();
    res.json(section);
  } catch (err) {
    console.error('--- BRANCH SECTION SAVE ERROR ---', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — delete a section (cascade delete its items)
router.delete('/:id', checkBranch, async (req, res) => {
  try {
    const section = await BranchSection.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    if (section.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    // Cascade delete items
    await BranchSectionItem.deleteMany({ sectionId: section._id, tenantId: req.tenantId });
    await BranchSection.findByIdAndDelete(req.params.id);

    // Re-index remaining sections for the same branchId and page to close order gaps
    const remainingSections = await BranchSection.find({
      tenantId: req.tenantId,
      branchId: section.branchId,
      page: section.page,
    }).sort({ order: 1 });

    for (let i = 0; i < remainingSections.length; i++) {
      remainingSections[i].order = i;
      await remainingSections[i].save();
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ITEM SUB-ROUTES (mounted at /:sectionId/items)
// ============================================================

// GET /:sectionId/items — list items for a section
router.get('/:sectionId/items', checkBranch, async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section = await BranchSection.findById(sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    if (section.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    const items = await BranchSectionItem.find({ tenantId: req.tenantId, sectionId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:sectionId/items — create item
router.post('/:sectionId/items', checkBranch, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { slug, media, order = 0, translations = {}, body = '', gallery = [], attributes = [] } = req.body;

    const section = await BranchSection.findById(sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    if (section.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    // Only entity_carousel and feature_carousel support items
    if (!['entity_carousel', 'feature_carousel'].includes(section.type)) {
      return res.status(400).json({ error: 'This section type does not support items' });
    }

    if (!slug) return res.status(400).json({ error: 'slug is required' });
    if (!media || !media.type || !media.url) return res.status(400).json({ error: 'media (type, url) is required' });

    // Check slug uniqueness per tenant
    const existing = await BranchSectionItem.findOne({ tenantId: req.tenantId, slug });
    if (existing) return res.status(409).json({ error: 'Slug already in use for this tenant' });

    const item = new BranchSectionItem({
      tenantId: req.tenantId,
      branchId: section.branchId,
      sectionId,
      slug,
      media,
      order,
      translations,
      body,
      gallery,
      attributes,
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:sectionId/items/:itemId — update item
router.put('/:sectionId/items/:itemId', checkBranch, async (req, res) => {
  try {
    const { sectionId, itemId } = req.params;
    const { slug, media, order, translations, isActive, body, gallery, attributes } = req.body;

    const item = await BranchSectionItem.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });
    if (String(item.sectionId) !== sectionId) return res.status(400).json({ error: 'Item does not belong to this section' });

    if (slug !== undefined) {
      // Check slug uniqueness if changing
      if (slug !== item.slug) {
        const existing = await BranchSectionItem.findOne({ tenantId: req.tenantId, slug });
        if (existing) return res.status(409).json({ error: 'Slug already in use for this tenant' });
      }
      item.slug = slug;
    }
    if (media !== undefined) item.media = media;
    if (order !== undefined) item.order = order;
    if (translations !== undefined) item.translations = translations;
    if (isActive !== undefined) item.isActive = isActive;
    if (body !== undefined) item.body = body;
    if (gallery !== undefined) item.gallery = gallery;
    if (attributes !== undefined) item.attributes = attributes;

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:sectionId/items/:itemId — delete item
router.delete('/:sectionId/items/:itemId', checkBranch, async (req, res) => {
  try {
    const { sectionId, itemId } = req.params;

    const item = await BranchSectionItem.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });
    if (String(item.sectionId) !== sectionId) return res.status(400).json({ error: 'Item does not belong to this section' });

    await BranchSectionItem.findByIdAndDelete(itemId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:sectionId/items/reorder — bulk reorder items
router.put('/:sectionId/items/reorder', checkBranch, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

    const section = await BranchSection.findById(sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    if (section.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    for (let i = 0; i < orderedIds.length; i++) {
      await BranchSectionItem.findOneAndUpdate(
        { _id: orderedIds[i], tenantId: req.tenantId, sectionId },
        { order: i }
      );
    }

    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;