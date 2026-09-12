/**
 * Migration: Create default AttributeGroups for existing ProductAttribute types.
 *
 * Maps legacy hardcoded types to new AttributeGroup documents:
 *   author    → Authors   (✍️)
 *   publisher → Publishers (🏛️)
 *   genre     → Genres    (📚)
 *   language  → Languages (🌍)
 *   series    → Series    (📖)
 *   custom    → Custom    (🏷️)
 *
 * Usage: node scripts/migrations/migrate-attribute-groups.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in .env');
  process.exit(1);
}

const DEFAULT_GROUPS = [
  { type: 'author',    name: 'Authors',    icon: '✍️', sortOrder: 0 },
  { type: 'publisher', name: 'Publishers', icon: '🏛️', sortOrder: 1 },
  { type: 'genre',     name: 'Genres',     icon: '📚', sortOrder: 2 },
  { type: 'language',  name: 'Languages',  icon: '🌍', sortOrder: 3 },
  { type: 'series',    name: 'Series',     icon: '📖', sortOrder: 4 },
  { type: 'custom',    name: 'Custom',     icon: '🏷️', sortOrder: 5 },
];

async function migrate() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  const AttributeGroup = mongoose.model(
    'AttributeGroup',
    new mongoose.Schema(
      {
        tenantId: String,
        name: String,
        slug: String,
        icon: { type: String, default: '' },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        translations: { type: Map, of: new mongoose.Schema({ name: String }, { _id: false }), default: {} },
      },
      { timestamps: true }
    ).index({ tenantId: 1, slug: 1 }, { unique: true }),
  );

  const ProductAttribute = mongoose.model('ProductAttribute');

  // Get all distinct tenantIds that have ProductAttributes
  const tenantIds = await ProductAttribute.distinct('tenantId');
  console.log(`📋 Found ${tenantIds.length} tenant(s) with attributes\n`);

  let totalGroupsCreated = 0;
  let totalAttrsUpdated = 0;

  for (const tenantId of tenantIds) {
    console.log(`── Tenant: ${tenantId} ──`);

    for (const def of DEFAULT_GROUPS) {
      // Check if group already exists
      let group = await AttributeGroup.findOne({ tenantId, slug: def.type });

      if (!group) {
        group = await AttributeGroup.create({
          tenantId,
          name: def.name,
          slug: def.type,
          icon: def.icon,
          sortOrder: def.sortOrder,
          isActive: true,
        });
        totalGroupsCreated++;
        console.log(`  ✅ Created group: ${def.name} (${def.type})`);
      } else {
        console.log(`  ⏭️  Group exists: ${def.name} (${def.type})`);
      }

      // Link existing attributes of this type to the group
      const result = await ProductAttribute.updateMany(
        { tenantId, type: def.type, $or: [{ groupId: null }, { groupId: { $exists: false } }] },
        { $set: { groupId: group._id.toString() } },
      );

      if (result.modifiedCount > 0) {
        totalAttrsUpdated += result.modifiedCount;
        console.log(`  🔗 Linked ${result.modifiedCount} attribute(s) to ${def.name}`);
      }
    }

    console.log('');
  }

  console.log('══════════════════════════════════════');
  console.log(`✨ Migration complete!`);
  console.log(`   Groups created: ${totalGroupsCreated}`);
  console.log(`   Attributes linked: ${totalAttrsUpdated}`);
  console.log('══════════════════════════════════════');

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
