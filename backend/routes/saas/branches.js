const express = require('express');
const router = express.Router();
const Branch = require('../../models/Branch');
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/auth/tenant');
const slugify = require('../../utils/slugify');

// ─── Navigation sync helpers ─────────────────────────────────────────────────
// When a custom page is created, renamed, or deleted, the corresponding
// navigation item in TenantSettings.navigation.items must be kept in sync
// so that storefront links always point to the correct slug.

/**
 * Add a new navigation item for a newly created custom page.
 */
async function addNavigationItemForPage(tenantId, slug, title) {
  try {
    let settings = await TenantSettings.findOne({ tenantId });
    if (!settings) settings = new TenantSettings({ tenantId });
    // Initialize the navigation structure if it doesn't exist yet, so the
    // new custom page always gets a nav item (previously this helper silently
    // skipped when no nav config had ever been saved, leaving the page
    // unmanageable in the navbar settings).
    if (!settings.navigation) {
      settings.navigation = { items: [], dropdownLabel: '' };
    }
    if (!Array.isArray(settings.navigation.items)) {
      settings.navigation.items = [];
    }
    // Don't add if a nav item for this slug already exists
    const exists = settings.navigation.items.some(
      (item) => item.type === 'custom' && item.slug === slug
    );
    if (exists) return;
    const maxOrder = settings.navigation.items.reduce((max, i) => Math.max(max, i.order || 0), 0);
    settings.navigation.items.push({
      id: `custom-${slug}`,
      type: 'custom',
      slug,
      label: title || '',
      isVisible: true,
      placement: 'dropdown',
      order: maxOrder + 1,
    });
    settings.markModified('navigation');
    await settings.save();
    console.log(`-> Navigation: added item for custom page "${slug}"`);
  } catch (err) {
    console.error('Failed to add navigation item for custom page:', err.message);
  }
}

/**
 * Update slug on all navigation items that match the old custom page slug.
 */
async function syncNavigationSlugOnRename(tenantId, oldSlug, newSlug, newTitle) {
  try {
    const settings = await TenantSettings.findOne({ tenantId });
    if (!settings?.navigation?.items?.length) return;
    let changed = false;
    for (const item of settings.navigation.items) {
      if (item.type === 'custom' && item.slug === oldSlug) {
        item.slug = newSlug;
        item.id = `custom-${newSlug}`;
        if (newTitle) item.label = newTitle;
        changed = true;
      }
    }
    if (changed) {
      settings.markModified('navigation');
      await settings.save();
      console.log(`-> Navigation: synced slug "${oldSlug}" → "${newSlug}"`);
    }
  } catch (err) {
    console.error('Failed to sync navigation slug:', err.message);
  }
}

/**
 * Remove the navigation item for a deleted custom page.
 */
async function removeNavigationItemForPage(tenantId, slug) {
  try {
    const settings = await TenantSettings.findOne({ tenantId });
    if (!settings?.navigation?.items?.length) return;
    const len = settings.navigation.items.length;
    settings.navigation.items = settings.navigation.items.filter(
      (item) => !(item.type === 'custom' && item.slug === slug)
    );
    if (settings.navigation.items.length < len) {
      settings.markModified('navigation');
      await settings.save();
      console.log(`-> Navigation: removed item for custom page "${slug}"`);
    }
  } catch (err) {
    console.error('Failed to remove navigation item:', err.message);
  }
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
    const branches = await Branch.find({ tenantId: req.tenantId, isActive: true }).sort({ city: 1, name: 1 }).lean();
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

    // Если создаём подфилию - проверяем, что родитель существует и принадлежит тому же тенанту
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
    const branches = await Branch.find({ tenantId, isActive: true }).sort({ city: 1, name: 1 }).lean();
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

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM PAGES - sub-resource of Branch
// ═══════════════════════════════════════════════════════════════════════════

/** Slugs that map to hardcoded storefront routes and must never be reused */
const RESERVED_PAGE_SLUGS = [
  'home', 'catalog', 'menu', 'contacts', 'gallery', 'articles',
  'reservations', 'partners', 'order', 'login', 'profile', 'admin',
];

// GET /saas/branches/:branchId/custom-pages - list all custom pages for a branch
router.get('/:branchId/custom-pages', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId })
      .select('customPages')
      .lean();
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch.customPages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /saas/branches/:branchId/custom-pages - create a custom page
router.post('/:branchId/custom-pages', authTenant, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    // Auto-generate slug from title
    const baseSlug = slugify(title);
    if (!baseSlug) {
      return res.status(400).json({ error: 'Could not generate a valid slug from the title' });
    }

    // Check reserved slugs
    if (RESERVED_PAGE_SLUGS.includes(baseSlug)) {
      return res.status(400).json({ error: `Slug "${baseSlug}" is reserved and cannot be used` });
    }

    // Ensure slug uniqueness across all branches of this tenant
    const slugExists = await Branch.findOne({
      tenantId: req.tenantId,
      'customPages.slug': baseSlug,
    }).lean();
    if (slugExists) {
      return res.status(409).json({ error: `A custom page with slug "${baseSlug}" already exists` });
    }

    // Ensure slug uniqueness within this branch
    const duplicateInBranch = (branch.customPages || []).some(cp => cp.slug === baseSlug);
    if (duplicateInBranch) {
      return res.status(409).json({ error: `A custom page with slug "${baseSlug}" already exists in this branch` });
    }

    branch.customPages = branch.customPages || [];
    branch.customPages.push({
      title: title.trim(),
      titleI18n: req.body.titleI18n || {},
      slug: baseSlug,
      description: req.body.description || '',
      descriptionI18n: req.body.descriptionI18n || {},
      seoTitle: req.body.seoTitle || '',
      seoTitleI18n: req.body.seoTitleI18n || {},
      seoDescription: req.body.seoDescription || '',
      seoDescriptionI18n: req.body.seoDescriptionI18n || {},
      ogImage: req.body.ogImage || '',
      isActive: true,
      createdAt: new Date(),
    });
    await branch.save();

    // Auto-add navigation item for the new custom page
    await addNavigationItemForPage(req.tenantId, baseSlug, title.trim());

    const created = branch.customPages[branch.customPages.length - 1];
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /saas/branches/:branchId/custom-pages/:slug - update a custom page
router.put('/:branchId/custom-pages/:slug', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const cp = (branch.customPages || []).find(p => p.slug === req.params.slug);
    if (!cp) return res.status(404).json({ error: 'Custom page not found' });

    const { title, titleI18n, description, descriptionI18n, seoTitle, seoTitleI18n, seoDescription, seoDescriptionI18n, ogImage, isActive, slug: newSlug } = req.body;

    if (title !== undefined) {
      cp.title = title.trim();
    }
    if (titleI18n !== undefined) {
      cp.titleI18n = titleI18n;
    }
    if (description !== undefined) {
      cp.description = description;
    }
    if (descriptionI18n !== undefined) {
      cp.descriptionI18n = descriptionI18n;
    }
    if (seoTitle !== undefined) {
      cp.seoTitle = seoTitle;
    }
    if (seoTitleI18n !== undefined) {
      cp.seoTitleI18n = seoTitleI18n;
    }
    if (seoDescription !== undefined) {
      cp.seoDescription = seoDescription;
    }
    if (seoDescriptionI18n !== undefined) {
      cp.seoDescriptionI18n = seoDescriptionI18n;
    }
    if (ogImage !== undefined) {
      cp.ogImage = ogImage;
    }
    if (isActive !== undefined) {
      cp.isActive = isActive;
    }

    // Handle slug rename
    if (newSlug && newSlug !== cp.slug) {
      const renamedSlug = slugify(newSlug);
      if (!renamedSlug) {
        return res.status(400).json({ error: 'Could not generate a valid slug' });
      }
      if (RESERVED_PAGE_SLUGS.includes(renamedSlug)) {
        return res.status(400).json({ error: `Slug "${renamedSlug}" is reserved` });
      }
      // Check uniqueness across tenant (excluding this branch)
      const slugConflict = await Branch.findOne({
        tenantId: req.tenantId,
        _id: { $ne: branch._id },
        'customPages.slug': renamedSlug,
      }).lean();
      if (slugConflict) {
        return res.status(409).json({ error: `Slug "${renamedSlug}" is already in use` });
      }
      // Also check within this branch (excluding current entry)
      const conflictInBranch = (branch.customPages || []).some(
        p => p.slug === renamedSlug && p.slug !== cp.slug
      );
      if (conflictInBranch) {
        return res.status(409).json({ error: `Slug "${renamedSlug}" is already used in this branch` });
      }

      const oldSlug = cp.slug;
      cp.slug = renamedSlug;

      // Rename the `page` field on all BranchSection documents for this branch
      const BranchSection = require('../../models/BranchSection');
      await BranchSection.updateMany(
        { branchId: branch._id, page: oldSlug },
        { $set: { page: renamedSlug } }
      );

      // Sync navigation items to use the new slug
      const updatedTitle = title !== undefined ? title.trim() : cp.title;
      await syncNavigationSlugOnRename(req.tenantId, oldSlug, renamedSlug, updatedTitle);
    }

    await branch.save();
    res.json(cp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /saas/branches/:branchId/custom-pages/:slug - delete a custom page
router.delete('/:branchId/custom-pages/:slug', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.branchId, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const idx = (branch.customPages || []).findIndex(p => p.slug === req.params.slug);
    if (idx === -1) return res.status(404).json({ error: 'Custom page not found' });

    const removedSlug = branch.customPages[idx].slug;
    branch.customPages.splice(idx, 1);
    await branch.save();

    // Clean up orphaned BranchSection docs for the deleted page
    const BranchSection = require('../../models/BranchSection');
    await BranchSection.deleteMany({ branchId: branch._id, page: removedSlug, isSystem: false });

    // Remove the navigation item for the deleted page
    await removeNavigationItemForPage(req.tenantId, removedSlug);

    res.json({ message: 'Custom page deleted', slug: removedSlug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;