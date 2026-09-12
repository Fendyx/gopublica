/**
 * Migration: Delete all global (tenantId: null) CategoryTranslation records.
 *
 * These "default" categories (flowers, electronics, etc.) were never tied to
 * any tenant and should not exist. Tenants create their own categories.
 *
 * Usage:
 *   node scripts/utilities/delete-global-categories.js            # live run
 *   node scripts/utilities/delete-global-categories.js --dry-run  # preview only
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const col = db.collection('categorytranslations');

  const total = await col.countDocuments({ tenantId: null });
  console.log(`\n📦 Found ${total} global categories (tenantId: null)`);

  if (total === 0) {
    console.log('Nothing to delete.');
    await mongoose.disconnect();
    return;
  }

  // Show sample
  const sample = await col.find({ tenantId: null }).project({ key: 1, name: 1, niche: 1 }).limit(20).toArray();
  console.log('\nSample global categories:');
  sample.forEach(c => console.log(`  • ${c.key} — ${c.name} (niche: ${c.niche})`));

  if (dryRun) {
    console.log('\n🔍 DRY RUN — no changes made.');
  } else {
    const result = await col.deleteMany({ tenantId: null });
    console.log(`\n🗑️  Deleted ${result.deletedCount} global categories.`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
