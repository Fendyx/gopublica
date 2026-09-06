/**
 * Migration: Fix TenantUser googleId unique sparse index
 *
 * Problem: googleId had `default: null` + `unique: true, sparse: true`.
 * In MongoDB, `sparse: true` only omits documents where the field is absent.
 * Since default was `null`, the field IS stored as null, and multiple nulls
 * violate the unique constraint → E11000 duplicate key error on registration.
 *
 * Fix:
 *   1. Drop the existing googleId_1 index
 *   2. Unset googleId on all documents where it is null (make field absent)
 *   3. Recreate the index via Mongoose schema (happens on next app boot)
 *
 * Run with: node scripts/migrations/fix-tenantuser-googleid-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in environment');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const collection = db.collection('tenantusers');

    // 1. Drop the existing googleId index
    console.log('🗑️  Dropping googleId_1 index...');
    try {
      await collection.dropIndex('googleId_1');
      console.log('   ✅ Index dropped');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('   ℹ️  Index not found (may already be dropped)');
      } else {
        throw e;
      }
    }

    // 2. Remove googleId field from all documents where it is null
    //    After this, the field is truly absent → sparse index will skip them
    console.log('\n🧹 Removing googleId:null from existing documents...');
    const result = await collection.updateMany(
      { googleId: null },
      { $unset: { googleId: '' } }
    );
    console.log(`   ✅ Updated ${result.modifiedCount} documents\n`);

    // 3. Recreate the index with sparse: true
    console.log('🔨 Recreating sparse unique index on googleId...');
    await collection.createIndex(
      { googleId: 1 },
      { unique: true, sparse: true, background: true }
    );
    console.log('   ✅ Index recreated\n');

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

runMigration();
