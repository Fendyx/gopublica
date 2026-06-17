// backend/scripts/migrate-add-category-icons.js
require('dotenv').config();
const mongoose = require('mongoose');
const CategoryTranslation = require('../models/CategoryTranslation');

// Автоматический маппинг иконок по ключу категории
const DEFAULT_ICONS = {
  // === Основные блюда ===
  'burgers': '🍔',
  'pizza': '🍕',
  'pasta': '🍝',
  'sushi': '🍣',
  'rolls': '🍣',
  'ramen': '🍜',
  'noodles': '🍜',
  'rice': '🍚',
  'curry': '🍛',
  'steak': '🥩',
  'meat': '🥩',
  'chicken': '🍗',
  'wings': '🍗',
  'fish': '🐟',
  'seafood': '🦐',
  'tacos': '🌮',
  'wraps': '🌯',
  'sandwiches': '🥪',
  'hot-dogs': '🌭',
  'kebab': '🥙',
  'shawarma': '🥙',

  // === Немецкие категории ===
  'suppen': '🍲',
  'hauptgerichte': '🍽️',
  'kleine-speisen': '🥗',
  'vorspeisen': '🥗',
  'nachspeisen': '🍰',
  'beilagen': '🥔',
  'fleischgerichte': '🥩',
  'fischgerichte': '🐟',
  'vegetarisch': '🥦',

  // === Закуски / Стартеры ===
  'appetizers': '🥗',
  'starters': '🥗',
  'snacks': '🍟',
  'salads': '🥗',

  // === Завтраки / Обеды ===
  'breakfast': '🍳',
  'brunch': '🥞',
  'lunch': '🍱',
  'dinner': '🍽️',

  // === Десерты ===
  'desserts': '🍰',
  'cakes': '🎂',
  'ice-cream': '🍦',
  'waffles': '🧇',
  'pancakes': '🥞',
  'pastry': '🥐',
  'bread': '🍞',
  'bakery': '🥐',

  // === Напитки ===
  'drinks': '🥤',
  'beverages': '🥤',
  'coffee': '☕',
  'tea': '🍵',
  'juice': '🧃',
  'smoothies': '🥤',
  'smoothies-fruity': '🍓',
  'beer': '🍺',
  'wine': '🍷',
  'cocktails': '🍹',
  'alcohol': '🍻',
  'lemonade': '🍋',
  'milkshakes': '🥛',

  // === Специальные ===
  'vegetarian': '🥦',
  'vegan': '🌱',
  'kids': '🧒',
  'kids-menu': '🧒',
  'special': '⭐',
  'seasonal': '🍂',
  'new': '🆕',
  'popular': '🔥',
  'spicy': '🌶️',
  'gluten-free': '🌾',
  'combo': '🎁',
  'sets': '🎁',
};

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const categories = await CategoryTranslation.find({});
  console.log(`📦 Found ${categories.length} categories`);

  let updated = 0;
  let skipped = 0;

  for (const cat of categories) {
    // Не перезаписывать уже установленные иконки
    if (cat.icon) {
      console.log(`⏭️  Skip [${cat.key}] — already has icon: ${cat.icon}`);
      skipped++;
      continue;
    }

    // Ищем маппинг по ключу (регистронезависимо)
    const icon = DEFAULT_ICONS[cat.key.toLowerCase()] || DEFAULT_ICONS[cat.key] || '🍽️';

    await CategoryTranslation.updateOne({ _id: cat._id }, { $set: { icon } });
    console.log(`✏️  [${cat.key}] → ${icon}`);
    updated++;
  }

  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});