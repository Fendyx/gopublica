import { SolutionModule } from './types';

export const solutions: SolutionModule[] = [
  // 🍔 Рестораны
  {
    id: 'qr-menu',
    titleKey: 'solutions.modules.qrMenu.title',
    descriptionKey: 'solutions.modules.qrMenu.desc',
    category: 'food',
    badge: 'included',
    videoSrc: '/videos/qr-menu-preview.mp4',
    slug: 'qr-menu',
    tags: ['menu', 'qr']
  },
  {
    id: 'reservations',
    titleKey: 'solutions.modules.reservations.title',
    descriptionKey: 'solutions.modules.reservations.desc',
    category: 'food',
    badge: 'premium',
    videoSrc: '/videos/reservations-preview.mp4',
    slug: 'reservations',
    tags: ['booking', 'table']
  },
  {
    id: 'online-ordering',
    titleKey: 'solutions.modules.onlineOrdering.title',
    descriptionKey: 'solutions.modules.onlineOrdering.desc',
    category: 'food',
    badge: 'included',
    videoSrc: '/videos/online-ordering-preview.mp4',
    slug: 'online-ordering',
    tags: ['takeout', 'delivery']
  },
  // ✂️ Салоны
  {
    id: 'appointments',
    titleKey: 'solutions.modules.appointments.title',
    descriptionKey: 'solutions.modules.appointments.desc',
    category: 'beauty',
    badge: 'premium',
    videoSrc: '/videos/appointments-preview.mp4',
    slug: 'appointments',
    tags: ['booking', 'staff']
  },
  {
    id: 'staff-management',
    titleKey: 'solutions.modules.staffManagement.title',
    descriptionKey: 'solutions.modules.staffManagement.desc',
    category: 'beauty',
    badge: 'included',
    videoSrc: '/videos/staff-management-preview.mp4',
    slug: 'staff-management',
    tags: ['team']
  },
  {
    id: 'portfolio',
    titleKey: 'solutions.modules.portfolio.title',
    descriptionKey: 'solutions.modules.portfolio.desc',
    category: 'beauty',
    badge: 'included',
    videoSrc: '/videos/portfolio-preview.mp4',
    slug: 'portfolio',
    tags: ['gallery']
  },
  // 🚗 Автосервисы
  {
    id: 'quote-estimator',
    titleKey: 'solutions.modules.quoteEstimator.title',
    descriptionKey: 'solutions.modules.quoteEstimator.desc',
    category: 'auto',
    badge: 'premium',
    videoSrc: '/videos/quote-estimator-preview.mp4',
    slug: 'quote-estimator',
    tags: ['lead']
  },
  {
    id: 'before-after',
    titleKey: 'solutions.modules.beforeAfter.title',
    descriptionKey: 'solutions.modules.beforeAfter.desc',
    category: 'auto',
    badge: 'included',
    videoSrc: '/videos/before-after-preview.mp4',
    slug: 'before-after',
    tags: ['gallery']
  },
  {
    id: 'service-request',
    titleKey: 'solutions.modules.serviceRequest.title',
    descriptionKey: 'solutions.modules.serviceRequest.desc',
    category: 'auto',
    badge: 'included',
    videoSrc: '/videos/service-request-preview.mp4',
    slug: 'service-request',
    tags: ['lead', 'photo']
  },
  // 🏢 Универсальные
  {
    id: 'careers',
    titleKey: 'solutions.modules.careers.title',
    descriptionKey: 'solutions.modules.careers.desc',
    category: 'universal',
    badge: 'included',
    videoSrc: '/videos/careers-preview.mp4',
    slug: 'careers',
    tags: ['hiring']
  },
  {
    id: 'review-booster',
    titleKey: 'solutions.modules.reviewBooster.title',
    descriptionKey: 'solutions.modules.reviewBooster.desc',
    category: 'universal',
    badge: 'included',
    videoSrc: '/videos/review-booster-preview.mp4',
    slug: 'review-booster',
    tags: ['reputation']
  },
  {
    id: 'analytics',
    titleKey: 'solutions.modules.analytics.title',
    descriptionKey: 'solutions.modules.analytics.desc',
    category: 'universal',
    badge: 'included',
    videoSrc: '/videos/analytics-preview.mp4',
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