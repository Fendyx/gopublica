export interface ProductSpec {
  key: string;
  value: string;
  keyI18n?: Record<string, string>;
  valueI18n?: Record<string, string>;
}

export interface PlatformProduct {
  _id: string;
  title: string;
  titleI18n?: Record<string, string>;
  description: string;
  descriptionI18n?: Record<string, string>;
  price: number;
  currency: string;
  photo: string;
  gallery: string[];
  specs: ProductSpec[];
  targetNiches: string[];
  category: 'hardware' | 'digital' | 'service';
  isActive: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformProductFormData {
  title: string;
  titleI18n: Record<string, string>;
  description: string;
  descriptionI18n: Record<string, string>;
  price: number;
  currency: string;
  photo: string;
  gallery: string[];
  specs: ProductSpec[];
  targetNiches: string[];
  category: 'hardware' | 'digital' | 'service';
  isActive: boolean;
  stock: number;
}

export const EMPTY_PRODUCT_FORM: PlatformProductFormData = {
  title: '',
  titleI18n: {},
  description: '',
  descriptionI18n: {},
  price: 0,
  currency: 'EUR',
  photo: '',
  gallery: [],
  specs: [],
  targetNiches: ['all'],
  category: 'hardware',
  isActive: true,
  stock: -1,
};
