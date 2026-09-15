export interface SolutionModule {
  id: string;
  titleKey: string;          // ключ для next-intl перевода
  descriptionKey: string;
  category: 'food' | 'beauty' | 'auto' | 'universal';
  videoSrc: string;           // путь к превью-видео
  mediaSrc?: string;          // путь к статическому медиа (приоритет над videoSrc)
  mediaType?: 'image' | 'gif' | 'video'; // тип медиа по mediaSrc (по умолчанию 'image')
  slug: string;               // URL-фрагмент, например "qr-menu"
  tags?: string[];            // для фильтрации внутри категории
}