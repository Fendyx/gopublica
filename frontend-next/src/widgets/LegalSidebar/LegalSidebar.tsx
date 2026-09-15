'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import {
  Menu,
  X,
  Rocket,
  Package,
  CreditCard,
  Building2,
  Shield,
  FileText,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  services: Rocket,
  delivery: Package,
  payment: CreditCard,
  imprint: Building2,
  privacy: Shield,
  terms: FileText,
};

const DOCUMENTS = [
  { key: 'services', href: '/legal/services' },
  { key: 'delivery', href: '/legal/delivery' },
  { key: 'payment', href: '/legal/payment' },
  { key: 'imprint', href: '/legal/imprint' },
  { key: 'privacy', href: '/legal/privacy' },
  { key: 'terms', href: '/legal/terms' },
] as const;

export default function LegalSidebar() {
  const t = useTranslations('legal');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger FAB */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed bottom-24 right-6 z-[60] flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary-color)] text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 z-[70] h-full w-72 bg-[var(--bg)] border-r border-[var(--border)] shadow-2xl transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {t('sidebarTitle')}
          </h3>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3">
          <LegalNavLinks pathname={pathname} t={t} />
        </nav>
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-24">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 px-3">
            {t('sidebarTitle')}
          </h3>
          <nav>
            <LegalNavLinks pathname={pathname} t={t} />
          </nav>
        </div>
      </aside>
    </>
  );
}

function LegalNavLinks({
  pathname,
  t,
}: {
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <ul className="space-y-0.5">
      {DOCUMENTS.map((doc) => {
        const isActive = pathname.endsWith(doc.href);
        const Icon = ICON_MAP[doc.key];

        return (
          <li key={doc.key}>
            <Link
              href={doc.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-medium shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-[var(--primary-color)]' : 'text-[var(--text-muted)]'
                  )}
                />
              )}
              <span className="flex-1">{t(doc.key)}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
