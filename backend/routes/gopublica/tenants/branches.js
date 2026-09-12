const express = require('express');
const router = express.Router();
const Branch = require('../../../models/Branch');
const slugify = require('../../../utils/slugify');

// Helper: generate unique slug
async function generateUniqueSlug(tenantId, baseName, excludeBranchId = null) {
  let slug = slugify(baseName);
  if (!slug) slug = 'branch';
  let candidate = slug;
  let suffix = 2;
  while (true) {
    const query = { tenantId, slug: candidate };
    if (excludeBranchId) query._id = { $ne: excludeBranchId };
    const existing = await Branch.findOne(query).lean();
    if (!existing) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
}

/**
 * GET /api/gopublica/tenants/branches?tenantId=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const branches = await Branch.find({ tenantId }).sort({ city: 1, name: 1 }).lean();
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gopublica/tenants/branches/:id?tenantId=
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const branch = await Branch.findOne({ _id: req.params.id, tenantId }).lean();
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gopublica/tenants/branches?tenantId=
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const { name, city, address, phone, email, workingHours, coordinates, settingsOverride, parentBranchId, venueType, slug } = req.body;

    let branchSlug = slug || await generateUniqueSlug(tenantId, name || 'New Branch');
    if (slug && !/^[a-z0-9-]+$/.test(branchSlug)) {
      return res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens' });
    }
    const existing = await Branch.findOne({ tenantId, slug: branchSlug });
    if (existing) return res.status(409).json({ error: 'Slug already in use' });

    const branch = await Branch.create({
      tenantId, name, city, address, phone, email, workingHours, coordinates,
      settingsOverride, parentBranchId, venueType, slug: branchSlug,
    });
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/branches/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const branch = await Branch.findOne({ _id: req.params.id, tenantId });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const { name, city, address, phone, email, workingHours, coordinates, settingsOverride, parentBranchId, venueType, isActive, slug } = req.body;

    if (name !== undefined) branch.name = name;
    if (city !== undefined) branch.city = city;
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (email !== undefined) branch.email = email;
    if (workingHours !== undefined) branch.workingHours = workingHours;
    if (coordinates !== undefined) branch.coordinates = coordinates;
    if (settingsOverride !== undefined) branch.settingsOverride = settingsOverride;
    if (parentBranchId !== undefined) branch.parentBranchId = parentBranchId;
    if (venueType !== undefined) branch.venueType = venueType;
    if (isActive !== undefined) branch.isActive = isActive;
    if (slug !== undefined && slug !== branch.slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens' });
      }
      const slugExists = await Branch.findOne({ tenantId, slug, _id: { $ne: branch._id } });
      if (slugExists) return res.status(409).json({ error: 'Slug already in use' });
      branch.slug = slug;
    }

    await branch.save();
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/branches/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const branch = await Branch.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
