'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, CreditCard, LayoutDashboard } from 'lucide-react';

const navItems = [
  { key: 'home', href: '/', icon: Home },
  { key: 'solutions', href: '/solutions', icon: LayoutGrid },
  { key: 'pricing', href: '/pricing', icon: CreditCard },
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
] as const;

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname.match(/^\/[a-z]{2}\/?$/);
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ key, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={key}
              href={href}
              className="flex flex-col items-center justify-center gap-1 w-full py-1"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${
                  active
                    ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              </motion.div>
              <span
                className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                  active ? 'text-[var(--primary-color)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {t(key as any)}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
