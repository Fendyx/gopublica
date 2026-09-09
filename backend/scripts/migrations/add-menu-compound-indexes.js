/**
 * Migration: Add compound indexes for menu/catalog performance
 *
 * Problem: The public menu endpoint queries MenuItem with:
 *   { tenantId, $or: [{ branchId }, { branchId: null }] }
 *     .sort({ categoryKey: 1, order: 1 })
 * Individual indexes on tenantId and branchId cannot efficiently serve this query.
 *
 * Fix:
 *   1. Drop redundant single-field indexes (tenantId_1, branchId_1) on MenuItem
 *   2. Create compound index { tenantId: 1, branchId: 1, categoryKey: 1, order: 1 }
 *   3. Create compound index { tenantId: 1, niche: 1, order: 1 } on CategoryTranslation
 *
 * Run with: node scripts/migrations/add-menu-compound-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in environment');
  process.exit(1);
}

async function dropIndexSafe(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
    console.log(`   ✅ Dropped ${indexName}`);
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log(`   ℹ️  ${indexName} not found (may already be dropped)`);
    } else {
      throw e;
    }
  }
}

async function runMigration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;

    // ── MenuItem indexes ──────────────────────────────────────────────────
    console.log('📦 MenuItem indexes...');
    const menuCol = db.collection('menuitems');

    // Drop redundant single-field indexes (covered by compound)
    await dropIndexSafe(menuCol, 'tenantId_1');
    await dropIndexSafe(menuCol, 'branchId_1');

    // Create compound index for the primary public query
    console.log('\n🔨 Creating compound index { tenantId, branchId, categoryKey, order }...');
    await menuCol.createIndex(
      { tenantId: 1, branchId: 1, categoryKey: 1, order: 1 },
      { background: true }
    );
    console.log('   ✅ Compound index created\n');

    // ── CategoryTranslation indexes ───────────────────────────────────────
    console.log('📦 CategoryTranslation indexes...');
    const catCol = db.collection('categorytranslations');

    // Create compound index for { tenantId, niche } queries sorted by order
    console.log('🔨 Creating compound index { tenantId, niche, order }...');
    await catCol.createIndex(
      { tenantId: 1, niche: 1, order: 1 },
      { background: true }
    );
    console.log('   ✅ Compound index created\n');

    // ── Verify ────────────────────────────────────────────────────────────
    console.log('🔍 Verifying indexes...\n');

    const menuIndexes = await menuCol.indexes();
    console.log('MenuItem indexes:');
    menuIndexes.forEach(idx => {
      const keys = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
      console.log(`   - ${idx.name} { ${keys} }${idx.unique ? ' (unique)' : ''}`);
    });

    const catIndexes = await catCol.indexes();
    console.log('\nCategoryTranslation indexes:');
    catIndexes.forEach(idx => {
      const keys = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
      console.log(`   - ${idx.name} { ${keys} }${idx.unique ? ' (unique)' : ''}`);
    });

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

runMigration();
