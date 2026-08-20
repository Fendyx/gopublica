const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BranchSection = require('../../models/BranchSection');
const BranchSectionItem = require('../../models/BranchSectionItem');
const Branch = require('../../models/Branch');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// ============================================================
// PUBLIC ROUTES (no auth required, no tenant resolution)
// ============================================================

// GET /public/branch-sections?branchId=&branchSlug=&page=home
// Returns active sections for a branch, sorted by order.
// For entity_carousel/feature_carousel types, embeds active items.
// Accepts either branchId (MongoDB ObjectId) or branchSlug (URL-safe slug string).
router.get('/', async (req, res) => {
  try {
    const { branchId, branchSlug, page = 'home' } = req.query;

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    if (!resolvedBranchId) {
      return res.status(400).json({ error: 'branchId or branchSlug is required' });
    }

    const sections = await BranchSection.find({ branchId: resolvedBranchId, page, isActive: true })
      .sort({ order: 1 })
      .lean();

    // ── Fetch all carousel items in a single $in query (fixes N+1) ──
    const carouselSectionIds = sections
      .filter(s => ['entity_carousel', 'feature_carousel'].includes(s.type))
      .map(s => s._id);

    const allItems = carouselSectionIds.length > 0
      ? await BranchSectionItem.find({
          sectionId: { $in: carouselSectionIds },
          isActive: true,
        })
          .sort({ sectionId: 1, order: 1 })
          .lean()
      : [];

    // Group items by sectionId in memory
    const itemsBySection = {};
    for (const item of allItems) {
      const sid = item.sectionId.toString();
      if (!itemsBySection[sid]) itemsBySection[sid] = [];
      itemsBySection[sid].push(item);
    }

    const sectionsWithItems = sections.map(section => ({
      ...section,
      items: itemsBySection[section._id.toString()] || [],
    }));

    res.json(sectionsWithItems);
  } catch (err) {
    console.error('Error fetching public branch sections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /public/branch-sections/items/:slug
// Returns a single BranchSectionItem by slug (for entity detail pages)
router.get('/items/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('[DEBUG] GET /items/:slug - slug:', slug);
    console.log('[DEBUG] GET /items/:slug - tenantId:', req.query.tenantId);

    const item = await BranchSectionItem.findOne({
      slug,
      tenantId: req.query.tenantId,
    }).lean();
    console.log('[DEBUG] GET /items/:slug - findOne result:', item);

    if (!item) return res.status(404).json({ error: 'Item not found' });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;