'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, LayoutGrid, CreditCard, LayoutDashboard } from 'lucide-react';
import { memo } from 'react';

const navItems = [
  { key: 'home', href: '/', icon: Home },
  { key: 'solutions', href: '/solutions', icon: LayoutGrid },
  { key: 'pricing', href: '/pricing', icon: CreditCard },
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
] as const;

const NavItem = memo(function NavItem({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 w-full py-1 active:scale-90 transition-transform duration-100"
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${
          active
            ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
            : 'text-[var(--text-muted)]'
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
      </div>
      <span
        className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
          active ? 'text-[var(--primary-color)]' : 'text-[var(--text-muted)]'
        }`}
      >
        {label}
      </span>
    </Link>
  );
});

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || !!pathname.match(/^\/[a-z]{2}\/?$/);
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--surface)] animate-[slideUp_0.3s_ease-out_forwards]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ key, href, icon }) => {
          return (
            <NavItem
              key={key}
              active={isActive(href)}
              href={href}
              icon={icon}
              label={t(key as any)}
            />
          );
        })}
      </div>
    </nav>
  );
}
