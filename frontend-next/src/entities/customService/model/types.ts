export interface CustomService {
  _id: string;
  tenantId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes: string;
  paymentIntentId: string | null;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
