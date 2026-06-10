'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  CreditCard,
  Globe,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useTenantAuthStore } from '@/store/tenantAuthStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const { logout, user } = useTenantAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: '/dashboard', label: t('nav.overview'), icon: LayoutDashboard },
    { href: '/dashboard/billing', label: t('nav.billing'), icon: CreditCard },
    { href: '/dashboard/sites', label: t('nav.sites'), icon: Globe },
    { href: '/dashboard/settings', label: t('nav.settings'), icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-[var(--surface)] border-r border-[var(--border)] transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
          <span className="font-bold text-lg">GoPublica</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="shrink-0 p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center text-sm font-bold">
                {mounted ? (user?.name?.[0]?.toUpperCase() || 'U') : ''}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                {mounted ? (user?.name || '') : ''}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                {mounted ? (user?.email || '') : ''}
                </p>
            </div>
            </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={logout}
          >
            <LogOut size={16} />
            {t('logout')}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] p-4 flex items-center gap-4">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold">
            {navItems.find((item) => isActive(item.href))?.label || t('title')}
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}