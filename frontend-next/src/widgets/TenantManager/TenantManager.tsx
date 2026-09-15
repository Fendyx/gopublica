'use client';

import { useState } from 'react';
import {
  Settings, Building2, UtensilsCrossed, ShoppingCart, Users, CalendarDays,
  UserCog, Images, FileText, Globe, CreditCard, Shield, Sparkles, BarChart3,
} from 'lucide-react';
import TenantSelector from './TenantSelector';
import SettingsTab from './tabs/SettingsTab';
import BranchesTab from './tabs/BranchesTab';
import MenuTab from './tabs/MenuTab';
import OrdersTab from './tabs/OrdersTab';
import CustomersTab from './tabs/CustomersTab';
import ReservationsTab from './tabs/ReservationsTab';
import StaffTab from './tabs/StaffTab';
import GalleryTab from './tabs/GalleryTab';
import ArticlesTab from './tabs/ArticlesTab';
import SitesTab from './tabs/SitesTab';
import SubscriptionsTab from './tabs/SubscriptionsTab';
import UsersTab from './tabs/UsersTab';
import BeautyTab from './tabs/BeautyTab';
import AnalyticsTab from './tabs/AnalyticsTab';

type TabId = 'settings' | 'branches' | 'menu' | 'orders' | 'customers' | 'reservations' | 'staff' | 'gallery' | 'articles' | 'sites' | 'subscriptions' | 'users' | 'beauty' | 'analytics';

const TABS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'branches', label: 'Branches', icon: Building2 },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reservations', label: 'Reservations', icon: CalendarDays },
  { id: 'staff', label: 'Staff', icon: UserCog },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'sites', label: 'Sites', icon: Globe },
  { id: 'subscriptions', label: 'Billing', icon: CreditCard },
  { id: 'users', label: 'Users', icon: Shield },
  { id: 'beauty', label: 'Beauty', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function TenantManager() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('settings');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const renderTab = () => {
    if (!selectedTenantId) return null;
    const props = { tenantId: selectedTenantId, onRefresh: refresh, key: refreshKey };
    switch (activeTab) {
      case 'settings': return <SettingsTab {...props} />;
      case 'branches': return <BranchesTab {...props} />;
      case 'menu': return <MenuTab {...props} />;
      case 'orders': return <OrdersTab {...props} />;
      case 'customers': return <CustomersTab {...props} />;
      case 'reservations': return <ReservationsTab {...props} />;
      case 'staff': return <StaffTab {...props} />;
      case 'gallery': return <GalleryTab {...props} />;
      case 'articles': return <ArticlesTab {...props} />;
      case 'sites': return <SitesTab {...props} />;
      case 'subscriptions': return <SubscriptionsTab {...props} />;
      case 'users': return <UsersTab {...props} />;
      case 'beauty': return <BeautyTab {...props} />;
      case 'analytics': return <AnalyticsTab {...props} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tenant Manager</h2>
        <p className="text-sm text-[var(--text-muted)]">Full access to any tenant&apos;s data and settings.</p>
      </div>

      <TenantSelector selectedTenantId={selectedTenantId} onSelect={setSelectedTenantId} />

      {selectedTenantId && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === id
                    ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {renderTab()}
          </div>
        </>
      )}

      {!selectedTenantId && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-20 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-[var(--text-muted)]/40" />
          <p className="text-[var(--text-muted)]">Select a tenant above to manage their data.</p>
        </div>
      )}
    </div>
  );
}
