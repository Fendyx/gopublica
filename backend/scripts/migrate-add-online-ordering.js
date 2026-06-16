// backend/scripts/migrate-add-online-ordering.js
require('dotenv').config(); // загружаем .env из текущей папки (backend)
const mongoose = require('mongoose');
const TenantSettings = require('../models/TenantSettings');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Подключено к MongoDB');

    const result = await TenantSettings.updateMany(
      {
        $or: [
          { 'features.hasOnlineOrdering': { $exists: false } },
          { 'payments': { $exists: false } }
        ]
      },
      {
        $set: {
          'features.hasOnlineOrdering': false,
          'payments': {
            stripeAccountId: '',
            chargesEnabled: false,
            payoutsEnabled: false,
            onboardingComplete: false,
            platformFeePercent: 5
          }
        }
      }
    );

    console.log(`✅ Обновлено документов: ${result.modifiedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  }
}

migrate();