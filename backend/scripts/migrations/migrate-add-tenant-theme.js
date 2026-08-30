/**
 * migrate-add-tenant-theme.js
 *
 * Что делает:
 * 1. Всем существующим тенантам у которых нет niche — ставит 'food'
 * 2. Всем у кого нет theme — ставит дефолтную тему
 * 3. Всем у кого нет features — ставит дефолтные фичи
 *
 * Запуск:
 *   node scripts/migrate-add-tenant-theme.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gopublica';

const DEFAULT_THEME = {
  primary:           '#ff0505',
  accent:            '#F1A208',
  fontHeading:       'playfair',
  heroStyle:         'video',
  heroVideoUrl:      '',
  heroPosterUrl:     '',
  heroSliderImages:  [],
  heroBgImage:       '',
  menuStyle:         'grid',
  galleryStyle:      'bento',
};

const DEFAULT_FEATURES = {
  hasMenu:         true,
  hasBooking:      true,
  hasGallery:      true,
  hasDelivery:     false,
  hasClickCollect: false,
};

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  // .lean() — возвращает чистые JS-объекты без магии Mongoose
  // Без него Mongoose подставляет дефолты из схемы и скрипт думает что поля уже есть
  const collection = mongoose.connection.collection('tenantsettings');
  const all = await collection.find({}).toArray();

  console.log(`📋 Found ${all.length} tenants to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const tenant of all) {
    const changes = {};

    // 1. niche
    if (!tenant.niche) {
      changes.niche = 'food';
    }

    // 2. theme — проверяем именно в сыром объекте из MongoDB
    if (!tenant.theme || typeof tenant.theme !== 'object') {
      changes.theme = DEFAULT_THEME;
    } else {
      // Дозаполняем только отсутствующие поля
      for (const [key, value] of Object.entries(DEFAULT_THEME)) {
        if (tenant.theme[key] === undefined || tenant.theme[key] === null) {
          changes[`theme.${key}`] = value;
        }
      }
    }

    // 3. features
    if (!tenant.features || typeof tenant.features !== 'object') {
      changes.features = DEFAULT_FEATURES;
    } else {
      for (const [key, value] of Object.entries(DEFAULT_FEATURES)) {
        if (tenant.features[key] === undefined || tenant.features[key] === null) {
          changes[`features.${key}`] = value;
        }
      }
    }

    // 4. domain — не трогаем (у каждого будет свой домен, ставится вручную)

    if (Object.keys(changes).length > 0) {
      await collection.updateOne(
        { _id: tenant._id },
        { $set: changes }
      );
      console.log(`  ✏️  ${tenant.tenantId}`);
      for (const [k, v] of Object.entries(changes)) {
        console.log(`       ${k}: ${JSON.stringify(v)}`);
      }
      updated++;
    } else {
      console.log(`  ⏭️  ${tenant.tenantId} — already up to date`);
      skipped++;
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});