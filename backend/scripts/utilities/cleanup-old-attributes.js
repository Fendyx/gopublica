/**
 * Diagnostic + cleanup script for old hardcoded ProductAttributes.
 *
 * Usage:
 *   node scripts/utilities/cleanup-old-attributes.js              → dry-run (read-only)
 *   node scripts/utilities/cleanup-old-attributes.js --delete     → actually delete
 *   node scripts/utilities/cleanup-old-attributes.js --tenant X   → scope to one tenant
 *   node scripts/utilities/cleanup-old-attributes.js --type author → scope to one type
 *
 * What it does:
 *   1. Lists all ProductAttribute docs per tenant (type, name, slug, groupId, productCount)
 *   2. Lists all AttributeGroup docs per tenant
 *   3. Checks which attributes are still referenced by MenuItem.attributeRefs
 *   4. With --delete: removes attributeRefs from MenuItems, then deletes the attributes
 */

const mongoose = require('mongoose');
require('dotenv').config();

// ── Parse CLI args ──
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--delete');
const tenantFilter = args.includes('--tenant') ? args[args.indexOf('--tenant') + 1] : null;
const typeFilter = args.includes('--type') ? args[args.indexOf('--type') + 1] : null;

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in .env');
  process.exit(1);
}

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  if (DRY_RUN) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔍 DRY RUN — no changes will be made');
    console.log('  Run with --delete to actually remove attributes');
    console.log('═══════════════════════════════════════════════════════════\n');
  } else {
    console.log('⚠️  DELETE MODE — changes WILL be written to the database!\n');
  }

  // Use raw collections to avoid schema compilation issues
  const attrsCol = mongoose.connection.collection('productattributes');
  const groupsCol = mongoose.connection.collection('attributegroups');
  const menuCol = mongoose.connection.collection('menuitems');

  // 1. Get all tenants that have attributes
  const tenantQuery = tenantFilter ? { tenantId: tenantFilter } : {};
  const allAttrs = await attrsCol.find(tenantQuery).sort({ tenantId: 1, type: 1, name: 1 }).toArray();

  const tenants = [...new Set(allAttrs.map((a) => a.tenantId))];
  console.log(`📋 Found ${allAttrs.length} attributes across ${tenants.length} tenant(s)\n`);

  // 2. Get all groups
  const groupQuery = tenantFilter ? { tenantId: tenantFilter } : {};
  const allGroups = await groupsCol.find(groupQuery).toArray();

  let totalWouldDelete = 0;
  let totalWouldUnlink = 0;
  const attrsToDelete = [];

  for (const tenantId of tenants) {
    const tenantAttrs = allAttrs.filter((a) => a.tenantId === tenantId);
    const tenantGroups = allGroups.filter((g) => g.tenantId === tenantId);

    console.log(`═══════════════════════════════════════════════════════════════`);
    console.log(`  🏢 Tenant: ${tenantId}`);
    console.log(`═══════════════════════════════════════════════════════════════`);

    // Show groups
    console.log(`\n  📁 Attribute Groups (${tenantGroups.length}):`);
    if (tenantGroups.length === 0) {
    } else {
      for (const g of tenantGroups) {
        const count = tenantAttrs.filter(
          (a) => a.groupId === g._id.toString() || a.type === g.slug
        ).length;
        console.log(`     ${g.icon || '🏷️'}  ${g.name} (${g.slug}) — ${count} attribute(s)`);
      }
    }

    // Show attributes
    const typeGroups = {};
    for (const attr of tenantAttrs) {
      const t = typeFilter ? null : attr.type; // skip if filtering
      if (typeFilter && attr.type !== typeFilter) continue;
      if (!typeGroups[attr.type]) typeGroups[attr.type] = [];
      typeGroups[attr.type].push(attr);
    }

    console.log(`\n  📦 ProductAttributes (${typeFilter ? tenantAttrs.filter(a => a.type === typeFilter).length : tenantAttrs.length}):`);

    for (const [type, attrs] of Object.entries(typeGroups)) {
      const group = tenantGroups.find((g) => g.slug === type);
      const groupStatus = group ? `→ group "${group.name}"` : '⚠️  NO MATCHING GROUP';

      console.log(`\n  ── type="${type}" ${groupStatus} ──`);

      for (const attr of attrs) {
        const hasGroupId = attr.groupId ? `groupId=${attr.groupId}` : 'no groupId';
        const prodCount = attr.productCount || 0;

        // Check actual references in MenuItem
        const refCount = await menuCol.countDocuments({
          tenantId,
          'attributeRefs.attributeId': attr._id.toString(),
        });

        const refStatus = refCount > 0 ? `🔴 referenced by ${refCount} product(s)` : '✅ not referenced';
        const wouldDelete = refCount === 0;
        const icon = wouldDelete ? '🗑️' : '🔗';

        if (wouldDelete) totalWouldDelete++;
        totalWouldUnlink += refCount;

        console.log(`     ${icon} "${attr.name}" (${attr.slug}) — ${hasGroupId}, productCount=${prodCount}, ${refStatus}`);

        if (refCount > 0 || !wouldDelete) {
          attrsToDelete.push({
            attr,
            refCount,
            tenantId,
            type,
          });
        } else {
          // Attr with no references — can be safely deleted
          attrsToDelete.push({
            attr,
            refCount: 0,
            tenantId,
            type,
            safe: true,
          });
        }
      }
    }

    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');

  const safeDelete = attrsToDelete.filter((d) => d.safe);
  const needsUnlink = attrsToDelete.filter((d) => d.refCount > 0);

  console.log(`  Attributes safe to delete (no references): ${safeDelete.length}`);
  console.log(`  Attributes with product references (need unlink first): ${needsUnlink.length}`);
  console.log(`  Total attributeRefs to unlink: ${totalWouldUnlink}`);
  console.log('');

  if (DRY_RUN) {
    console.log('  ℹ️  This was a dry run. To delete, run with --delete flag:');
    console.log('     node scripts/utilities/cleanup-old-attributes.js --delete');
    console.log('');
    console.log('  To scope to a specific tenant:');
    console.log('     node scripts/utilities/cleanup-old-attributes.js --delete --tenant <tenantId>');
    console.log('');
    console.log('  To scope to a specific type:');
    console.log('     node scripts/utilities/cleanup-old-attributes.js --delete --type author');
  } else {
    console.log('  🗑️  Performing cleanup...\n');

    let deleted = 0;
    let unlinked = 0;

    for (const item of attrsToDelete) {
      const { attr, refCount, tenantId, type } = item;

      // Step 1: Remove attributeRefs from MenuItems
      if (refCount > 0) {
        const result = await menuCol.updateMany(
          { tenantId, 'attributeRefs.attributeId': attr._id.toString() },
          { $pull: { attributeRefs: { attributeId: attr._id.toString() } } },
        );
        unlinked += result.modifiedCount;
        console.log(`  🔗 Unlinked from ${result.modifiedCount} product(s): "${attr.name}" (${attr.slug})`);
      }

      // Step 2: Delete the attribute
      await attrsCol.deleteOne({ _id: attr._id });
      deleted++;
      console.log(`  🗑️  Deleted: "${attr.name}" (${attr.slug}, type=${type})`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ✅ Cleanup complete!`);
    console.log(`     Attributes deleted: ${deleted}`);
    console.log(`     AttributeRefs unlinked: ${unlinked}`);
    console.log('═══════════════════════════════════════════════════════════════');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
