/**
 * Migration: Recalculate productCount on all ProductAttribute documents.
 * Counts how many MenuItems reference each attribute via attributeRefs.
 *
 * Usage: node scripts/migrations/recalc-attribute-product-counts.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const ProductAttribute = require('../../models/ecommerce/ProductAttribute');
const MenuItem = require('../../models/food/MenuItem');

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  try {
    // Count products per attributeId across all tenants
    const pipeline = [
      { $unwind: '$attributeRefs' },
      {
        $group: {
          _id: '$attributeRefs.attributeId',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await MenuItem.aggregate(pipeline);
    console.log(`Found ${results.length} attributes with product references`);

    // Build a map of attributeId → count
    const countMap = new Map(results.map((r) => [r._id, r.count]));

    // Find all ProductAttribute documents
    const allAttrs = await ProductAttribute.find({}, { _id: 1, productCount: 1, name: 1, tenantId: 1 }).lean();
    console.log(`Found ${allAttrs.length} ProductAttribute documents`);

    let updated = 0;
    let unchanged = 0;

    for (const attr of allAttrs) {
      const correctCount = countMap.get(attr._id.toString()) || 0;
      if (attr.productCount !== correctCount) {
        await ProductAttribute.updateOne(
          { _id: attr._id },
          { $set: { productCount: correctCount } },
        );
        updated++;
        console.log(`  Updated "${attr.name}" (${attr.tenantId}): ${attr.productCount} → ${correctCount}`);
      } else {
        unchanged++;
      }
    }

    console.log(`\nDone. Updated: ${updated}, Unchanged: ${unchanged}`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
