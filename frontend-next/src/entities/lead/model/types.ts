export type LeadStatus =
  | 'New'
  | 'In Progress'
  | 'Closed'
  | 'Rejected'
  | 'Call Back'
  | 'No Answer'
  | 'Website Down'
  | 'Bad Website';

export type LeadPriority = 'Low' | 'Medium' | 'High';
export type SortBy = 'date' | 'status' | 'city';
export type SortDir = 'asc' | 'desc';

export interface AssignedUser {
  _id: string;
  name: string;
  email: string;
}

export interface Lead {
  _id?: string;
  name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  comment: string;
  city?: string;
  businessHours?: string;
  price?: number;
  businessType?: string;
  servicesRequested?: string[];
  priority?: LeadPriority;
  followUpAt?: string | null;
  assignedTo?: AssignedUser | string;
  createdBy?: AssignedUser | string;
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const STATUSES: LeadStatus[] = [
  'New', 'In Progress', 'Call Back', 'No Answer',
  'Website Down', 'Bad Website', 'Closed', 'Rejected',
];

export const PRIORITIES: LeadPriority[] = ['Low', 'Medium', 'High'];

export const BUSINESS_TYPES = [
  'Restaurant', 'Barbershop', 'Flower Shop',
  'Beauty Salon', 'Cafe', 'Gym', 'Hotel', 'Other',
];

export const PRESET_SERVICES = [
  'Menu', 'Table Booking', 'Admin Panel',
  'Online Booking (Barber/Salon)', 'Online Store',
  'Multilingual', 'SEO', 'Landing Page',
];

export const STATUS_COLOR: Record<LeadStatus, string> = {
  'New':          '#2563eb',
  'In Progress':  '#d97706',
  'Closed':       '#16a34a',
  'Rejected':     '#dc2626',
  'Call Back':    '#f59e0b',
  'No Answer':    '#6b7280',
  'Website Down': '#ea580c',
  'Bad Website':  '#7c3aed',
};

export const STATUS_ICON: Record<LeadStatus, string> = {
  'New':          '🆕',
  'In Progress':  '🔄',
  'Closed':       '✅',
  'Rejected':     '❌',
  'Call Back':    '📞',
  'No Answer':    '📵',
  'Website Down': '🔴',
  'Bad Website':  '🌐',
};

export const PRIORITY_COLOR: Record<LeadPriority, string> = {
  'Low':    '#6b7280',
  'Medium': '#d97706',
  'High':   '#dc2626',
};

export const getAssignedName = (val?: AssignedUser | string): string => {
  if (!val) return '—';
  if (typeof val === 'object') return val.name;
  return val;
};

export const getAssignedId = (val?: AssignedUser | string): string => {
  if (!val) return '';
  if (typeof val === 'object') return val._id;
  return val;
};