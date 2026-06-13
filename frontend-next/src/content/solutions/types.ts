export interface SolutionModule {
  id: string;
  titleKey: string;          // ключ для next-intl перевода
  descriptionKey: string;
  category: 'food' | 'beauty' | 'auto' | 'universal';
  badge?: 'included' | 'premium';
  videoSrc: string;           // путь к превью-видео
  slug: string;               // URL-фрагмент, например "qr-menu"
  tags?: string[];            // для фильтрации внутри категории
}