/**
 * migrate-add-furgonetka-fields.js
 *
 * Adds the new `logistics.env` and `logistics.mapApiKey` fields to all
 * TenantSettings documents that don't have them yet.
 *
 * Run:
 *   cd backend && node scripts/migrations/migrate-add-furgonetka-fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gopublica';

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Use the raw collection to avoid Mongoose applying schema defaults,
    // which would make it look like the fields already exist.
    const collection = mongoose.connection.collection('tenantsettings');

    // Find documents where logistics.env does NOT exist
    const result = await collection.updateMany(
      { 'logistics.env': { $exists: false } },
      {
        $set: {
          'logistics.env': 'sandbox',
          'logistics.mapApiKey': '',
        },
      }
    );

    console.log(`✅ Migration complete — ${result.modifiedCount} document(s) updated`);
    console.log('   Added: logistics.env = "sandbox", logistics.mapApiKey = ""');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
