'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Users, FileText, Settings, Menu, X, LogOut,
  Target,
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Редиректим только если мы НЕ на странице логина и токен отсутствует
  useEffect(() => {
    if (mounted && !token && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [token, mounted, pathname, router]);

  // На странице логина показываем только форму, без админского оформления
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Для всех остальных админских страниц ждём токен
  if (!mounted || !token) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/leads', label: 'Leads', icon: Target },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/news', label: 'Newsletters', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href));

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
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
          <span className="font-bold text-lg">GoPublica Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>
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
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center text-sm font-bold">
              {mounted ? (user?.name?.[0]?.toUpperCase() || 'A') : ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{mounted ? user?.name : ''}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{mounted ? user?.email : ''}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              logout();
              router.push('/admin/login');
            }}
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] p-4 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold">
            {navItems.find((item) => isActive(item.href))?.label || 'Admin'}
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}