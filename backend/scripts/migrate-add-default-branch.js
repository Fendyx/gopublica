// Запуск: node scripts/migrate-add-default-branch.js
require('dotenv').config();
const mongoose = require('mongoose');
const TenantSettings = require('../models/TenantSettings');
const Branch = require('../models/Branch');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const tenants = await TenantSettings.find({});
    console.log(`📦 Найдено тенантов: ${tenants.length}`);

    for (const tenant of tenants) {
      const existingBranch = await Branch.findOne({ tenantId: tenant.tenantId });
      if (!existingBranch) {
        // Скопируем данные из TenantSettings в дефолтный филиал
        const defaultBranch = new Branch({
          tenantId: tenant.tenantId,
          name: 'Основной',
          city: '',
          address: tenant.address || '',
          phone: tenant.phone || '',
          email: tenant.email || '',
          workingHours: {},
          settingsOverride: {
            phone: tenant.phone || '',
            email: tenant.email || '',
            address: tenant.address || '',
            googleMapsUrl: tenant.googleMapsUrl || '',
            hours: tenant.hours || '',
            hoursI18n: tenant.hoursI18n || {},
            seoTitle: tenant.seoTitle || '',
            seoTitleI18n: tenant.seoTitleI18n || {},
            seoDescription: tenant.seoDescription || '',
            seoDescriptionI18n: tenant.seoDescriptionI18n || {},
            primaryLanguage: tenant.primaryLanguage || '',
            primaryCurrency: tenant.primaryCurrency || '',
          }
        });
        await defaultBranch.save();
        console.log(`✅ Создан филиал для тенанта ${tenant.tenantId}`);
      } else {
        console.log(`⏩ У тенанта ${tenant.tenantId} уже есть филиал`);
      }
    }

    console.log('🎉 Миграция завершена');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка миграции:', err);
    process.exit(1);
  }
}

migrate();