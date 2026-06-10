import { create } from 'zustand';

interface TenantUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  tenantId: string | null;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  subscriptionPlan: 'none' | 'basic' | 'pro';
  currentPeriodEnd: string | null;
  companyName?: string;
  vatId?: string;
}

interface TenantAuthState {
  token: string | null;
  user: TenantUser | null;
  login: (token: string, user: TenantUser) => void;
  logout: () => void;
  updateUser: (user: Partial<TenantUser>) => void;
}

export const useTenantAuthStore = create<TenantAuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('tenant_token') : null,
  user: typeof window !== 'undefined' && localStorage.getItem('tenant_user')
    ? JSON.parse(localStorage.getItem('tenant_user') as string)
    : null,
  login: (token, user) => {
    localStorage.setItem('tenant_token', token);
    localStorage.setItem('tenant_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('tenant_token');
    localStorage.removeItem('tenant_user');
    set({ token: null, user: null });
  },
  updateUser: (partial) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      localStorage.setItem('tenant_user', JSON.stringify(updated));
      return { user: updated };
    }),
}));