import { SolutionModule } from './types';

export const solutions: SolutionModule[] = [
  // 🍔 Рестораны
  {
    id: 'qr-menu',
    titleKey: 'solutions.modules.qrMenu.title',
    descriptionKey: 'solutions.modules.qrMenu.desc',
    category: 'food',
    videoSrc: '/videos/qr-menu-preview.mp4',
    mediaSrc: '/images/solutions/qr-menu.jpg',
    slug: 'qr-menu',
    tags: ['menu', 'qr']
  },
  {
    id: 'reservations',
    titleKey: 'solutions.modules.reservations.title',
    descriptionKey: 'solutions.modules.reservations.desc',
    category: 'food',
    videoSrc: '/videos/reservations-preview.mp4',
    mediaSrc: '/images/solutions/reservations.png',
    slug: 'reservations',
    tags: ['booking', 'table']
  },
  {
    id: 'online-ordering',
    titleKey: 'solutions.modules.onlineOrdering.title',
    descriptionKey: 'solutions.modules.onlineOrdering.desc',
    category: 'food',
    videoSrc: '/videos/online-ordering-preview.mp4',
    mediaSrc: '/images/solutions/ordering.jpg',
    slug: 'online-ordering',
    tags: ['takeout', 'delivery']
  },
  // ✂️ Салоны
  {
    id: 'appointments',
    titleKey: 'solutions.modules.appointments.title',
    descriptionKey: 'solutions.modules.appointments.desc',
    category: 'beauty',
    videoSrc: '/videos/appointments-preview.mp4',
    mediaSrc: '/images/solutions/appointments.jpg',
    slug: 'appointments',
    tags: ['booking', 'staff']
  },
  {
    id: 'staff-management',
    titleKey: 'solutions.modules.staffManagement.title',
    descriptionKey: 'solutions.modules.staffManagement.desc',
    category: 'beauty',
    videoSrc: '/videos/staff-management-preview.mp4',
    mediaSrc: '/images/solutions/staff_management.jpg',
    slug: 'staff-management',
    tags: ['team']
  },
  {
    id: 'portfolio',
    titleKey: 'solutions.modules.portfolio.title',
    descriptionKey: 'solutions.modules.portfolio.desc',
    category: 'beauty',
    videoSrc: '/videos/portfolio-preview.mp4',
    mediaSrc: '/images/solutions/portfolio.jpg',
    slug: 'portfolio',
    tags: ['gallery']
  },
  // 🚗 Автосервисы
  {
    id: 'quote-estimator',
    titleKey: 'solutions.modules.quoteEstimator.title',
    descriptionKey: 'solutions.modules.quoteEstimator.desc',
    category: 'auto',
    videoSrc: '/videos/quote-estimator-preview.mp4',
    mediaSrc: '/images/solutions/quote-estimator.jpg',
    slug: 'quote-estimator',
    tags: ['lead']
  },
  {
    id: 'before-after',
    titleKey: 'solutions.modules.beforeAfter.title',
    descriptionKey: 'solutions.modules.beforeAfter.desc',
    category: 'auto',
    videoSrc: '/videos/before-after-preview.mp4',
    mediaSrc: '/images/solutions/before-after.jpg',
    slug: 'before-after',
    tags: ['gallery']
  },
  {
    id: 'service-request',
    titleKey: 'solutions.modules.serviceRequest.title',
    descriptionKey: 'solutions.modules.serviceRequest.desc',
    category: 'auto',
    videoSrc: '/videos/service-request-preview.mp4',
    mediaSrc: '/images/solutions/service-request.jpg',
    slug: 'service-request',
    tags: ['lead', 'photo']
  },
  // 🏢 Универсальные
  {
    id: 'data-compliance',
    titleKey: 'solutions.modules.dataCompliance.title',
    descriptionKey: 'solutions.modules.dataCompliance.desc',
    category: 'universal',
    videoSrc: '/videos/data-compliance-preview.mp4',
    mediaSrc: '/images/solutions/data-compliance.jpg',
    slug: 'data-compliance',
    tags: ['gdpr', 'privacy', 'consent']
  },
  {
    id: 'client-crm',
    titleKey: 'solutions.modules.clientCrm.title',
    descriptionKey: 'solutions.modules.clientCrm.desc',
    category: 'universal',
    videoSrc: '/videos/client-crm-preview.mp4',
    mediaSrc: '/images/solutions/.jpg',
    slug: 'client-crm',
    tags: ['crm', 'clients', 'manage']
  },
  {
    id: 'telegram-bot',
    titleKey: 'solutions.modules.telegramBot.title',
    descriptionKey: 'solutions.modules.telegramBot.desc',
    category: 'universal',
    videoSrc: '/videos/telegram-bot-preview.mp4',
    mediaSrc: '/images/solutions/telegrambot.jpg',
    slug: 'telegram-bot',
    tags: ['telegram', 'notifications', 'bot']
  },
  {
    id: 'careers',
    titleKey: 'solutions.modules.careers.title',
    descriptionKey: 'solutions.modules.careers.desc',
    category: 'universal',
    videoSrc: '/videos/careers-preview.mp4',
    mediaSrc: '/images/solutions/careers.jpg',
    slug: 'careers',
    tags: ['hiring']
  },
  {
    id: 'review-booster',
    titleKey: 'solutions.modules.reviewBooster.title',
    descriptionKey: 'solutions.modules.reviewBooster.desc',
    category: 'universal',
    videoSrc: '/videos/review-booster-preview.mp4',
    mediaSrc: '/images/solutions/review-booster.jpg',
    slug: 'review-booster',
    tags: ['reputation']
  },
  {
    id: 'analytics',
    titleKey: 'solutions.modules.analytics.title',
    descriptionKey: 'solutions.modules.analytics.desc',
    category: 'universal',
    videoSrc: '/videos/analytics-preview.mp4',
    mediaSrc: '/images/solutions/analytics.jpg',
    slug: 'analytics',
    tags: ['dashboard']
  }
];

export const categories = [
  { id: 'all', titleKey: 'solutions.categories.all' },
  { id: 'food', titleKey: 'solutions.categories.food' },
  { id: 'beauty', titleKey: 'solutions.categories.beauty' },
  { id: 'auto', titleKey: 'solutions.categories.auto' },
  { id: 'universal', titleKey: 'solutions.categories.universal' },
];