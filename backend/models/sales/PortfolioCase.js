const mongoose = require('mongoose');

const portfolioCaseSchema = new mongoose.Schema({
  // === Basic Info ===
  title: { type: String, required: true, trim: true }, // Название бизнеса
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true 
  }, // для URL: /case/barbershop-style
  niche: { 
    type: String, 
    enum: ['cafe', 'restaurant', 'barbershop', 'fitness', 'retail', 'services', 'other'],
    required: true 
  },
  
  // === Hero Section ===
  heroImages: [{
    url: { type: String, required: true }, // Cloudinary URL
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  liveUrl: { type: String, required: true }, // Ссылка на сайт
  shortDescription: { type: String, maxlength: 200 }, // Одна строка ценности для героя

  // === Content ===
  challenge: { type: String, required: true }, // Проблема клиента
  solution: { type: String, required: true },   // Ваше решение
  targetAudience: String, // Для кого делали
  
  // === Бизнес-индикаторы ===
  metrics: [{
    label: { type: String, required: true }, // "Рост конверсии"
    value: { type: String, required: true }, // "+30%"
    description: String // Пояснение (опционально)
  }],

  // === Функционал с привязкой к выгоде ===
  features: [{
    feature: { type: String, required: true }, // "Интеграция с CRM"
    benefit: { type: String, required: true }, // "Заявки не теряются"
    icon: String // Иконка для визуала (опционально)
  }],

  // === Визуальная демонстрация ===
  gallery: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    caption: String,
    isMobileView: { type: Boolean, default: false }, // Показывать в мокапе телефона
    sortOrder: { type: Number, default: 0 }
  }],

  // === Технические детали ===
  techStack: [{
    name: { type: String, required: true }, // "React"
    iconUrl: String // Ссылка на иконку (опционально)
  }],
  development: {
    durationWeeks: Number,
    teamSize: Number,
    startDate: Date,
    endDate: Date
  },

  // === Стоимость ===
  pricing: {
    showPrice: { type: Boolean, default: true }, // Скрыть если "по запросу"
    currency: { type: String, default: 'USD' },
    range: {
      min: Number,
      max: Number
    },
    packages: [{
      name: String, // "Basic", "Pro"
      price: Number,
      features: [String]
    }]
  },

  // === Meta & Admin ===
  isPublished: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }, // Для порядка в сетке
  testimonial: {
    text: String,
    author: String,
    role: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для получения основного изображения
portfolioCaseSchema.virtual('primaryImage').get(function() {
  return this.heroImages.find(img => img.isPrimary) || this.heroImages[0];
});

module.exports = mongoose.model('PortfolioCase', portfolioCaseSchema);