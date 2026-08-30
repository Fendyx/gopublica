/**
 * Migration: Add Telegram fields to TenantUser and TenantSettings
 *
 * Run with: node scripts/migrations/add-tenant-telegram-fields.js
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
    console.log('✅ Connected');

    const db = mongoose.connection.db;

    // 1. Add Telegram fields to TenantUser collection
    console.log('\n📝 Updating TenantUser collection...');

    // Add fields to existing documents (set defaults)
    const userResult = await db.collection('tenantusers').updateMany(
      {},
      {
        $set: {
          telegramChatId: null,
          telegramLinkedAt: null,
          telegramLinkToken: null,
          telegramLinkTokenExpiresAt: null,
        },
      }
    );
    console.log(`   Updated ${userResult.modifiedCount} TenantUser documents`);

    // Create indexes
    console.log('   Creating indexes...');
    await db.collection('tenantusers').createIndex(
      { tenantId: 1, telegramChatId: 1 },
      { name: 'tenantId_1_telegramChatId_1' }
    );
    await db.collection('tenantusers').createIndex(
      { telegramLinkToken: 1 },
      { name: 'telegramLinkToken_1', sparse: true }
    );
    console.log('   Indexes created');

    // 2. Add Telegram notifications config to TenantSettings collection
    console.log('\n📝 Updating TenantSettings collection...');

    const settingsResult = await db.collection('tenantsettings').updateMany(
      {},
      {
        $set: {
          'notifications.telegram': {
            enabled: false,
            events: {
              newOrder: true,
              newReservation: true,
              newJobApplication: true,
              newPartnerRequest: true,
            },
            branchOverrides: [],
          },
        },
      }
    );
    console.log(`   Updated ${settingsResult.modifiedCount} TenantSettings documents`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - TenantUser: added telegramChatId, telegramLinkedAt, telegramLinkToken, telegramLinkTokenExpiresAt');
    console.log('   - TenantUser: created compound index (tenantId, telegramChatId) and sparse index (telegramLinkToken)');
    console.log('   - TenantSettings: added notifications.telegram with events config and branchOverrides');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

runMigration();