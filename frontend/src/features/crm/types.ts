export type NewsType = 'info' | 'marketing' | 'alert';

export interface NewsPost {
  _id: string;
  type: NewsType;
  title: string;
  content: string;
  targetTenants?: string[];
  targetTariffs?: string[];
  showToNewClients: boolean;
  expiresAt?: string | null;
  createdAt: string;
}