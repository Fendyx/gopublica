const mongoose = require('mongoose');
require('dotenv').config();

const TenantSettings = require('../models/TenantSettings');

const fixFeaturesBooleans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Находим все документы, у которых features.hasJobApplications — строка
    const tenants = await TenantSettings.find({
      'features.hasJobApplications': { $type: 'string' }
    });

    console.log(`Найдено ${tenants.length} тенантов с строковым hasJobApplications`);

    for (const tenant of tenants) {
      const features = tenant.features || {};
      // Преобразуем строки в булевы для всех полей, которые могут быть строками
      const updatedFeatures = {};
      for (const [key, value] of Object.entries(features)) {
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') {
            updatedFeatures[key] = true;
          } else if (value.toLowerCase() === 'false') {
            updatedFeatures[key] = false;
          } else {
            updatedFeatures[key] = value; // оставляем как есть
          }
        } else {
          updatedFeatures[key] = value;
        }
      }
      tenant.features = updatedFeatures;
      await tenant.save();
      console.log(`Обновлён тенант ${tenant.tenantId}: features.hasJobApplications = ${tenant.features.hasJobApplications}`);
    }

    console.log('✅ Миграция завершена');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  }
};

fixFeaturesBooleans();