/**
 * One-time migration: slugify Cyrillic category keys → Latin transliteration.
 *
 * Updates:
 *   1. CategoryTranslation.key → slugified version
 *   2. MenuItem.categoryKey → matching update
 *
 * Usage:
 *   node scripts/migrations/slugify-category-keys.js
 *   node scripts/migrations/slugify-category-keys.js --dry-run
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

// ── Inline slugify (mirrors backend/utils/slugify.js) ────────────────────────
function transliterateChar(ch) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g',
    д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'shch', ь: '', ю: 'iu', я: 'ia',
    ё: 'yo', э: 'e', ъ: '',
  };
  return map[ch] ?? ch;
}

function slugify(text) {
  if (!text) return '';
  const input = String(text);
  const transliterated = [...input]
    .map((ch) => {
      const lower = ch.toLowerCase();
      if (/[a-z0-9]/.test(lower)) return lower;
      if (/[\s_]/.test(ch)) return '-';
      if (/[\u0400-\u04FF]/.test(lower)) return transliterateChar(lower);
      return '';
    })
    .join('');
  return transliterated
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// ── Migration ────────────────────────────────────────────────────────────────
async function migrate() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI environment variable is required');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);

  // Import models
  const CategoryTranslation = require('../../models/food/CategoryTranslation');
  const MenuItem = require('../../models/food/MenuItem');

  // Find all tenant-owned categories (not global ones)
  const categories = await CategoryTranslation.find({ tenantId: { $ne: null } }).lean();
  console.log(`Found ${categories.length} tenant-owned categories\n`);

  let updated = 0;
  let skipped = 0;

  for (const cat of categories) {
    const newKey = slugify(cat.name);

    // Skip if already slugified or empty
    if (!newKey || newKey === cat.key) {
      console.log(`  SKIP  "${cat.name}" → key already clean: "${cat.key}"`);
      skipped++;
      continue;
    }

    // Check if a category with the new key already exists
    const existing = await CategoryTranslation.findOne({
      key: newKey,
      tenantId: cat.tenantId,
      _id: { $ne: cat._id },
    });

    if (existing) {
      console.log(`  SKIP  "${cat.name}" → key "${newKey}" already taken by another category`);
      skipped++;
      continue;
    }

    const oldKey = cat.key;

    if (dryRun) {
      console.log(`  DRY   "${oldKey}" → "${newKey}" (${cat.name})`);
    } else {
      // Update category key
      await CategoryTranslation.updateOne(
        { _id: cat._id },
        { $set: { key: newKey } }
      );

      // Update products referencing this category
      const result = await MenuItem.updateMany(
        { tenantId: cat.tenantId, categoryKey: oldKey },
        { $set: { categoryKey: newKey } }
      );

      console.log(`  DONE  "${oldKey}" → "${newKey}" (${result.modifiedCount} products updated)`);
    }
    updated++;
  }

  console.log(`\n${dryRun ? 'DRY RUN' : 'Migration complete'}. ${updated} categories ${dryRun ? 'would be' : ''} updated, ${skipped} skipped.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
