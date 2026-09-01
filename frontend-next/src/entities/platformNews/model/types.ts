export interface PlatformNews {
  _id: string;
  title: string;
  titleI18n?: Record<string, string>;
  content: string;
  contentI18n?: Record<string, string>;
  type: 'info' | 'update' | 'announcement' | 'promo';
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformNewsFormData {
  title: string;
  titleI18n: Record<string, string>;
  content: string;
  contentI18n: Record<string, string>;
  type: 'info' | 'update' | 'announcement' | 'promo';
  isActive: boolean;
  publishedAt: string;
}

export const EMPTY_NEWS_FORM: PlatformNewsFormData = {
  title: '',
  titleI18n: {},
  content: '',
  contentI18n: {},
  type: 'info',
  isActive: true,
  publishedAt: '',
};
