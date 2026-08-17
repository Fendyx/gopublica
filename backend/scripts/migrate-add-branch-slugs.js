/**
 * Migration: Add slug and isDefault fields to existing Branch documents.
 *
 * - Generates a URL-safe slug from the branch name (slugify).
 * - On slug collision within the same tenant, appends a numeric suffix (-2, -3, ...).
 * - Marks the first branch (by createdAt) per tenant as isDefault: true.
 *
 * Usage: node scripts/migrate-add-branch-slugs.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');

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

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ─── Step 1: Backfill slugs ─────────────────────────────────────────────
    // Group branches by tenantId so we can detect collisions per-tenant.
    const branches = await Branch.find({}).sort({ tenantId: 1, createdAt: 1 });
    console.log(`📦 Found ${branches.length} branch documents`);

    // Track slugs already assigned per tenant for collision detection
    const usedSlugsByTenant = {};

    let updatedCount = 0;

    for (const branch of branches) {
      const tenantId = branch.tenantId;
      if (!usedSlugsByTenant[tenantId]) {
        usedSlugsByTenant[tenantId] = new Set();
      }

      let slug = slugify(branch.name);
      if (!slug) {
        // Fallback if name is empty or non-ASCII-only
        slug = 'branch';
      }

      // Handle collisions within the same tenant
      let candidate = slug;
      let suffix = 2;
      while (usedSlugsByTenant[tenantId].has(candidate)) {
        candidate = `${slug}-${suffix}`;
        suffix++;
      }
      slug = candidate;

      // Also check against existing slugs already in the DB (from prior runs)
      const existing = await Branch.findOne({
        tenantId,
        slug,
        _id: { $ne: branch._id },
      }).lean();
      if (existing) {
        // Collision with a pre-existing slug — keep incrementing
        do {
          candidate = `${slug}-${suffix}`;
          suffix++;
        } while (usedSlugsByTenant[tenantId].has(candidate) ||
                 await Branch.findOne({ tenantId, slug: candidate, _id: { $ne: branch._id } }).lean());
        slug = candidate;
      }

      usedSlugsByTenant[tenantId].add(slug);

      if (branch.slug !== slug) {
        branch.slug = slug;
        await branch.save();
        updatedCount++;
        console.log(`  ✅ ${branch.tenantId} / ${branch.name} → slug: "${slug}"`);
      } else {
        console.log(`  ⏭️  ${branch.tenantId} / ${branch.name} → already has slug: "${slug}"`);
      }
    }

    console.log(`\n📝 Updated ${updatedCount} branch slugs`);

    // ─── Step 2: Mark default branch per tenant ─────────────────────────────
    // The first branch (by createdAt) per tenant becomes the default.
    const tenants = Object.keys(usedSlugsByTenant);
    let defaultCount = 0;

    for (const tenantId of tenants) {
      // Check if this tenant already has a default
      const existingDefault = await Branch.findOne({ tenantId, isDefault: true });
      if (existingDefault) {
        console.log(`  ⏭️  Tenant ${tenantId} already has a default branch: ${existingDefault.name}`);
        continue;
      }

      // Find the first branch for this tenant (by createdAt)
      const firstBranch = await Branch.findOne({ tenantId }).sort({ createdAt: 1 });
      if (firstBranch) {
        firstBranch.isDefault = true;
        await firstBranch.save();
        defaultCount++;
        console.log(`  ✅ Tenant ${tenantId} → default branch: "${firstBranch.name}" (slug: "${firstBranch.slug}")`);
      }
    }

    console.log(`\n🎯 Set ${defaultCount} default branches`);

    console.log('\n🎉 Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
}

migrate();
