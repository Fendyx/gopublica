/**
 * Migration script: Move existing domains from TenantSettings to Site collection
 * Run with: node backend/scripts/migrate-domains-to-sites.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const TenantSettings = require('../models/TenantSettings');
const Site = require('../models/Site');
const TenantUser = require('../models/TenantUser');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all TenantSettings that have a valid domain (not null, not empty, not undefined)
    const settingsWithDomains = await TenantSettings.find({ 
      domain: { $ne: null, $ne: '', $exists: true, $type: 'string' } 
    }).lean();

    console.log(`📋 Found ${settingsWithDomains.length} tenants with valid domains`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const settings of settingsWithDomains) {
      try {
        const tenantId = settings.tenantId;
        
        // Check if site already exists for this tenant
        const existingSite = await Site.findOne({ tenantId, isActive: true });
        if (existingSite) {
          console.log(`⏭️  Skipping ${tenantId} - site already exists`);
          skipped++;
          continue;
        }

        // Get tenant user for plan info
        const tenantUser = await TenantUser.findOne({ tenantId }).select('subscriptionPlan subscriptionStatus');
        const plan = (tenantUser?.subscriptionStatus === 'active' || tenantUser?.subscriptionStatus === 'trialing') 
          ? tenantUser?.subscriptionPlan 
          : 'none';

        // Determine niche
        const niche = settings.niche || settings.businessType || 'food';

        // Create the site
        const site = await Site.create({
          tenantId,
          name: settings.businessName || 'Main Site',
          type: 'primary',
          niche,
          domain: settings.domain,
          status: settings.deploymentStatus || 'live',
          liveUrl: settings.liveUrl || (settings.domain ? `https://${settings.domain}` : ''),
          stagingUrl: settings.deploymentUrl || '',
          lastDeployedAt: settings.lastDeployedAt || null,
          deploymentLogs: settings.deploymentError ? [{
            status: 'error',
            error: settings.deploymentError,
            createdAt: settings.updatedAt || new Date(),
          }] : [],
          createdUnderPlan: plan,
        });

        console.log(`✅ Created site for ${tenantId}: ${settings.domain} (${site._id})`);
        created++;

        // Обновляем TenantSettings: добавляем domain в aliases для резолвинга,
        // если его там ещё нет (обратная совместимость)
        const existingAliases = settings.aliases || [];
        if (!existingAliases.includes(settings.domain)) {
          await TenantSettings.findOneAndUpdate(
            { tenantId },
            { $set: { aliases: [...existingAliases, settings.domain] } }
          );
        }
      } catch (err) {
        console.error(`❌ Error migrating ${settings.tenantId}:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors:  ${errors}`);
    console.log(`   Total:   ${settingsWithDomains.length}`);

  } catch (err) {
    console.error('💥 Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

migrate();