// frontend/src/entities/case/types.ts

export interface Metric {
  label: string;
  value: string;
  description?: string;
}

export interface Feature {
  feature: string;
  benefit: string;
  icon?: string;
}

export interface GalleryItem {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  isMobileView?: boolean;
  sortOrder?: number;
}

export interface TechStackItem {
  name: string;
  iconUrl?: string;
}

export interface PricingPackage {
  name: string;
  price: number;
  features: string[];
}

export interface PortfolioCase {
  _id: string;
  title: string;
  slug: string;
  niche: string;
  heroImages: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  liveUrl: string;
  shortDescription?: string;
  
  challenge: string;
  solution: string;
  targetAudience?: string; // ← Добавлено
  
  metrics: Metric[];
  features: Feature[];
  gallery: GalleryItem[];
  
  techStack: TechStackItem[];
  development?: {
    durationWeeks?: number;
    teamSize?: number;
  };
  
  pricing: {
    showPrice: boolean;
    currency: string;
    range?: { min?: number; max?: number };
    packages?: PricingPackage[];
  };
  
  testimonial?: {
    text: string;
    author: string;
    role: string;
  };
  
  isPublished: boolean;
  sortOrder: number; // ← Добавлено
  createdAt: string;
  updatedAt?: string;
  
  // Virtual
  primaryImage?: { url: string; alt?: string };
}