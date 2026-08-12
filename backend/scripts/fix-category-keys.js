require('dotenv').config(); // Чтобы подтянулся MONGO_URI из .env
const mongoose = require('mongoose');

// Подключаем твою модель товаров (предполагаю, что это MenuItem)
// Если товары в другой модели, поменяй путь и название переменной
const MenuItem = require('../models/MenuItem'); 

async function run() {
  try {
    // Подключаемся к базе. Проверь, как у тебя в .env называется переменная (MONGO_URI или MONGODB_URI)
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Успешно подключились к базе данных');

    // 1. Исправляем "Комікси" -> "комікси"
    const comicsResult = await MenuItem.updateMany(
      { categoryKey: "Комікси" },
      { $set: { categoryKey: "комікси" } }
    );
    console.log(`🔄 Исправлено товаров с категорией "Комікси": ${comicsResult.modifiedCount}`);

    // 2. Исправляем "Мерч" -> "мерч" (на всякий случай, раз мы только что его добавляли)
    const merchResult = await MenuItem.updateMany(
      { categoryKey: "Мерч" },
      { $set: { categoryKey: "мерч" } }
    );
    console.log(`🔄 Исправлено товаров с категорией "Мерч": ${merchResult.modifiedCount}`);

    console.log('🎉 Все категории успешно обновлены!');
  } catch (error) {
    console.error('❌ Ошибка при обновлении категорий:', error);
  } finally {
    // Закрываем соединение, чтобы скрипт завершил работу
    mongoose.connection.close();
    process.exit(0);
  }
}

run();