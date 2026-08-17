const express = require('express');
const router = express.Router();
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/authTenant');

/**
 * Slugify a string: lowercase, replace non-alphanumeric runs with hyphens,
 * trim leading/trailing hyphens.
 */
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug for a branch within a tenant.
 * If the base slug collides, appends -2, -3, etc.
 */
async function generateUniqueSlug(tenantId, baseName, excludeBranchId = null) {
  let slug = slugify(baseName);
  if (!slug) slug = 'branch';

  let candidate = slug;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { tenantId, slug: candidate };
    if (excludeBranchId) query._id = { $ne: excludeBranchId };
    const existing = await Branch.findOne(query).lean();
    if (!existing) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
}

// Получить все филиалы тенанта
router.get('/', authTenant, async (req, res) => {
  try {
    const branches = await Branch.find({ tenantId: req.tenantId, isActive: true }).sort({ city: 1, name: 1 });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать новый филиал
router.post('/', authTenant, async (req, res) => {
  try {
    const {
      name, city, address, phone, email, workingHours, coordinates, settingsOverride,
      parentBranchId, venueType, slug,
    } = req.body;

    // Если создаём подфилию — проверяем, что родитель существует и принадлежит тому же тенанту
    if (parentBranchId) {
      const parent = await Branch.findOne({ _id: parentBranchId, tenantId: req.tenantId });
      if (!parent) return res.status(400).json({ error: 'parentBranchId не найден для этого тенанта' });
    }

    // Auto-generate slug if not provided
    let branchSlug = slug;
    if (!branchSlug) {
      branchSlug = await generateUniqueSlug(req.tenantId, name);
    } else {
      // Validate provided slug format
      if (!/^[a-z0-9-]+$/.test(branchSlug)) {
        return res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens only' });
      }
      // Check uniqueness
      const existing = await Branch.findOne({ tenantId: req.tenantId, slug: branchSlug });
      if (existing) return res.status(409).json({ error: 'Slug already in use for this tenant' });
    }

    const branch = new Branch({
      tenantId: req.tenantId,
      name,
      slug: branchSlug,
      city,
      address,
      phone,
      email,
      workingHours,
      coordinates,
      settingsOverride,
      parentBranchId: parentBranchId || null,
      venueType: venueType || (parentBranchId ? 'concept' : 'main'),
    });
    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Публичный роут (без авторизации) – для клиентского сайта
router.get('/public/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const branches = await Branch.find({ tenantId, isActive: true }).sort({ city: 1, name: 1 });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Публичный роут: получить филиал по slug (без авторизации, по tenantId)
router.get('/public/:tenantId/slug/:slug', async (req, res) => {
  try {
    const { tenantId, slug } = req.params;
    const branch = await Branch.findOne({ slug, tenantId, isActive: true });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Публичный роут: получить дефолтный филиал тенанта (без авторизации)
router.get('/public/:tenantId/default', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const branch = await Branch.findOne({ tenantId, isDefault: true, isActive: true });
    if (!branch) return res.status(404).json({ error: 'Default branch not found' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить один филиал по slug (должен быть ДО /:id, чтобы не конфликтовать)
router.get('/slug', authTenant, async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug query parameter is required' });

    const branch = await Branch.findOne({ slug, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить один филиал
router.get('/:id', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить филиал
router.put('/:id', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });

    const {
      name, city, address, phone, email, workingHours, coordinates, settingsOverride, isActive,
      parentBranchId, venueType, slug, isDefault,
    } = req.body;

    if (name !== undefined) branch.name = name;
    if (city !== undefined) branch.city = city;
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (email !== undefined) branch.email = email;
    if (workingHours !== undefined) branch.workingHours = workingHours;
    if (coordinates !== undefined) branch.coordinates = coordinates;
    if (settingsOverride !== undefined) branch.settingsOverride = settingsOverride;
    if (isActive !== undefined) branch.isActive = isActive;

    // Handle slug update
    if (slug !== undefined) {
      if (!slug) {
        return res.status(400).json({ error: 'Slug cannot be empty' });
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens only' });
      }
      // Check uniqueness (excluding self)
      const existing = await Branch.findOne({ tenantId: req.tenantId, slug, _id: { $ne: branch._id } });
      if (existing) return res.status(409).json({ error: 'Slug already in use for this tenant' });
      branch.slug = slug;
    }

    // Handle isDefault update
    if (isDefault !== undefined) {
      if (isDefault) {
        // Unset any other default for this tenant
        await Branch.updateMany(
          { tenantId: req.tenantId, isDefault: true, _id: { $ne: branch._id } },
          { $set: { isDefault: false } }
        );
      }
      branch.isDefault = isDefault;
    }

    if (parentBranchId !== undefined) {
      // запрет самопривязки и привязки к чужому тенанту
      if (parentBranchId && String(parentBranchId) === String(branch._id)) {
        return res.status(400).json({ error: 'Филиал не может быть родителем самому себе' });
      }
      if (parentBranchId) {
        const parent = await Branch.findOne({ _id: parentBranchId, tenantId: req.tenantId });
        if (!parent) return res.status(400).json({ error: 'parentBranchId не найден для этого тенанта' });
      }
      branch.parentBranchId = parentBranchId || null;
    }
    if (venueType !== undefined) branch.venueType = venueType;

    await branch.save();
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить филиал (soft-delete)
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });
    branch.isActive = false;
    await branch.save();
    res.json({ message: 'Филиал деактивирован' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;