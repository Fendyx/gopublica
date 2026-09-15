export type NewsCategory = 'company' | 'product' | 'event' | 'tutorial' | 'announcement';
export type NewsMediaType = 'text' | 'photo' | 'video';

export interface GoPublicaNews {
  _id: string;
  title: string;
  titleI18n?: Record<string, string>;
  slug: string;
  category: NewsCategory;
  mediaType: NewsMediaType;
  coverImage: string;
  videoUrl: string;
  body: string;
  bodyI18n?: Record<string, string>;
  excerpt: string;
  excerptI18n?: Record<string, string>;
  seoTitle: string;
  seoTitleI18n?: Record<string, string>;
  seoDescription: string;
  seoDescriptionI18n?: Record<string, string>;
  author: string;
  isPinned: boolean;
  pinnedOrder: number;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Resolve a localized string from an i18n map, falling back to the base value. */
export function resolveI18n(
  base: string,
  i18nMap?: Record<string, string>,
  locale?: string,
): string {
  if (locale && i18nMap?.[locale]) return i18nMap[locale];
  return base;
}

export interface GoPublicaNewsFormData {
  title: string;
  titleI18n: Record<string, string>;
  slug: string;
  category: NewsCategory;
  mediaType: NewsMediaType;
  coverImage: string;
  videoUrl: string;
  body: string;
  bodyI18n: Record<string, string>;
  excerpt: string;
  excerptI18n: Record<string, string>;
  seoTitle: string;
  seoTitleI18n: Record<string, string>;
  seoDescription: string;
  seoDescriptionI18n: Record<string, string>;
  author: string;
  isPinned: boolean;
  pinnedOrder: number;
  isActive: boolean;
  publishedAt: string;
}

export const EMPTY_SITE_NEWS_FORM: GoPublicaNewsFormData = {
  title: '',
  titleI18n: {},
  slug: '',
  category: 'company',
  mediaType: 'text',
  coverImage: '',
  videoUrl: '',
  body: '',
  bodyI18n: {},
  excerpt: '',
  excerptI18n: {},
  seoTitle: '',
  seoTitleI18n: {},
  seoDescription: '',
  seoDescriptionI18n: {},
  author: 'GoPublica Team',
  isPinned: false,
  pinnedOrder: 0,
  isActive: true,
  publishedAt: '',
};
