/**
 * Migration: Add `activeLocales` and `defaultLocale` to all existing TenantSettings.
 *
 * For each tenant:
 *   1. If `activeLocales` doesn't exist yet → set it to all 6 supported locales.
 *   2. Set `defaultLocale` from the current `primaryLanguage` (fallback: 'pl').
 *
 * Safe to run multiple times - only updates documents that are missing the fields.
 *
 * Usage:
 *   node scripts/migrations/migrate-add-active-locales.js [--dry-run]
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const TenantSettings = require('../../models/TenantSettings');
const { LOCALE_CODES } = require('../../config/locales');

const DRY_RUN = process.argv.includes('--dry-run');

async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const filter = {
    $or: [
      { activeLocales: { $exists: false } },
      { activeLocales: { $size: 0 } },
      { defaultLocale: { $exists: false } },
    ],
  };

  const tenants = await TenantSettings.find(filter).lean();
  console.log(`📋 Found ${tenants.length} tenant(s) to migrate`);

  if (tenants.length === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    const activeLocales = LOCALE_CODES; // enable all supported locales
    const defaultLocale = tenant.primaryLanguage || 'pl';

    if (DRY_RUN) {
      console.log(`  [DRY RUN] ${tenant.tenantId}: activeLocales=${JSON.stringify(activeLocales)}, defaultLocale=${defaultLocale}`);
      updated++;
      continue;
    }

    try {
      await TenantSettings.updateOne(
        { _id: tenant._id },
        {
          $set: {
            activeLocales,
            defaultLocale,
          },
        },
      );
      console.log(`  ✅ ${tenant.tenantId} → activeLocales=${JSON.stringify(activeLocales)}, defaultLocale=${defaultLocale}`);
      updated++;
    } catch (err) {
      console.error(`  ❌ ${tenant.tenantId}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n🏁 Done. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
