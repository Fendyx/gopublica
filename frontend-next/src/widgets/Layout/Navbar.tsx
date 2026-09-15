'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  Utensils,
  Scissors,
  Wrench,
  Globe,
  LayoutDashboard,
  Phone,
} from 'lucide-react';
import LanguageSelector from '@/shared/ui/LanguageSelector';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { solutions, categories } from '@/content/solutions/modules';

export default function Navbar() {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const token = useTenantAuthStore((s) => s.token);

  useEffect(() => { setMounted(true); }, []);

  const categoryIcons: Record<string, any> = {
    food: Utensils,
    beauty: Scissors,
    auto: Wrench,
    universal: Globe,
  };

  const getModuleTitle = (modId: string) => {
    return t(`solutions.modules.${modId}.title` as any);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] transition-colors duration-200">
      {/* === MOBILE: logo + language selector only === */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-[var(--text)]">
          GoPublica
        </Link>
        <LanguageSelector />
      </div>

      {/* === DESKTOP: full horizontal nav === */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="text-xl font-bold text-[var(--text)]">
            GoPublica
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href="/presentation"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {t('nav.howItWorks')}
            </Link>

            {/* SOLUTIONS mega-menu */}
            <div className="relative group">
              <Link
                href="/solutions"
                className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
              >
                {t('nav.solutions')}
                <ChevronDown size={16} className="transition-transform group-hover:rotate-180" />
              </Link>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-6 grid grid-cols-4 gap-6">
                <Link
                  href="/solutions"
                  className="col-span-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[var(--primary-color)] hover:bg-[var(--bg)] transition-colors"
                >
                  <LayoutDashboard size={18} />
                  {t('nav.solutionsOverview')}
                </Link>
                <div className="col-span-4 border-t border-[var(--border)]" />
                {categories.map((cat) => {
                  const Icon = categoryIcons[cat.id] || Globe;
                  const mods = solutions.filter((m) => m.category === cat.id);
                  if (mods.length === 0) return null;
                  return (
                    <div key={cat.id} className="flex flex-col gap-1">
                      <h4 className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        <Icon size={14} />
                        {t(`solutions.categories.${cat.id}`)}
                      </h4>
                      {mods.map((mod) => (
                        <Link
                          key={mod.id}
                          href={`/solutions/${mod.slug}`}
                          className="block px-4 py-1.5 rounded-lg text-sm text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
                        >
                          {getModuleTitle(mod.id)}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/contact"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {t('nav.contact')}
            </Link>

            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white hover:opacity-90 transition-opacity"
            >
              <Phone size={14} />
              {t('nav.bookCall')}
            </Link>

            {mounted && token ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--primary-color)] hover:underline transition-colors"
              >
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/login-client"
                  className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register-client"
                  className="text-sm font-medium text-[var(--primary-color)] hover:underline transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
}