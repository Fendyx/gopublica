'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Menu,
  X,
  ChevronDown,
  Utensils,
  Scissors,
  Wrench,
  Globe,
  LayoutDashboard,
} from 'lucide-react';
import LanguageSelector from '@/shared/ui/LanguageSelector';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { solutions, categories } from '@/content/solutions/modules';

export default function Navbar() {
  const t = useTranslations(); // ✅ теперь работает, если есть провайдер
  const [isOpen, setIsOpen] = useState(false);
  const [solutionsAccordionOpen, setSolutionsAccordionOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { token } = useTenantAuthStore();

  const categoryIcons: Record<string, any> = {
    food: Utensils,
    beauty: Scissors,
    auto: Wrench,
    universal: Globe,
  };

  const closeMenu = () => {
    setIsOpen(false);
    setSolutionsAccordionOpen(false);
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('.hamburger')
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 👇 вспомогательная функция для получения перевода модуля
  const getModuleTitle = (modId: string) => {
    return t(`solutions.modules.${modId}.title` as any);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Логотип */}
        <Link
          href="/"
          className="text-xl font-bold text-[var(--text)]"
          onClick={closeMenu}
        >
          GoPublica
        </Link>

        {/* Бургер (мобилка) */}
        <button
          className="hamburger md:hidden p-2 rounded-md hover:bg-[var(--bg)] text-[var(--text)]"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Оверлей мобильного меню */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={closeMenu}
          />
        )}

        {/* Основное меню */}
        <div
          ref={menuRef}
          className={`fixed top-0 right-0 h-full w-72 bg-[var(--surface)] shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col pt-20 px-6 md:static md:h-auto md:w-auto md:shadow-none md:transform-none md:flex-row md:items-center md:gap-8 md:pt-0 md:px-0 md:bg-transparent ${
            isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          {/* Закрыть мобильное меню */}
          <button
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-[var(--bg)] md:hidden"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

          {/* Навигационные ссылки */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              onClick={closeMenu}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              onClick={closeMenu}
            >
              {t('nav.pricing')}
            </Link>

            {/* How it works */}
            <Link
              href="/presentation"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              onClick={closeMenu}
            >
              {t('nav.howItWorks')}
            </Link>

            {/* ===== SOLUTIONS DESKTOP ===== */}
            <div className="hidden md:block relative group">
              <Link
                href="/solutions"
                className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
                onClick={closeMenu}
              >
                {t('nav.solutions')}
                <ChevronDown
                  size={16}
                  className="transition-transform group-hover:rotate-180"
                />
              </Link>

              {/* Мега-меню */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-6 grid grid-cols-4 gap-6">
                {/* All solutions */}
                <Link
                  href="/solutions"
                  className="col-span-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[var(--primary-color)] hover:bg-[var(--bg)] transition-colors"
                  onClick={closeMenu}
                >
                  <LayoutDashboard size={18} />
                  {t('nav.solutionsOverview')}
                </Link>

                <div className="col-span-4 border-t border-[var(--border)]" />

                {/* Категории */}
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
                          onClick={closeMenu}
                        >
                          {getModuleTitle(mod.id)}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== SOLUTIONS MOBILE (аккордеон) ===== */}
            <div className="md:hidden">
              <button
                onClick={() => setSolutionsAccordionOpen(!solutionsAccordionOpen)}
                className="flex items-center justify-between w-full text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <span>{t('nav.solutions')}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    solutionsAccordionOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {solutionsAccordionOpen && (
                <div className="mt-2 ml-4 flex flex-col gap-2">
                  <Link
                    href="/solutions"
                    className="flex items-center gap-2 text-sm font-medium text-[var(--primary-color)] hover:underline"
                    onClick={closeMenu}
                  >
                    <LayoutDashboard size={16} />
                    {t('nav.solutionsOverview')}
                  </Link>
                  <div className="border-t border-[var(--border)] my-1" />
                  {categories.map((cat) => {
                    const Icon = categoryIcons[cat.id] || Globe;
                    const mods = solutions.filter((m) => m.category === cat.id);
                    if (mods.length === 0) return null;
                    return (
                      <div key={cat.id}>
                        <h5 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[var(--text-muted)] mt-2 mb-1">
                          <Icon size={12} />
                          {t(`solutions.categories.${cat.id}`)}
                        </h5>
                        {mods.map((mod) => (
                          <Link
                            key={mod.id}
                            href={`/solutions/${mod.slug}`}
                            className="block py-1 text-sm text-[var(--text)] hover:text-[var(--text-muted)] transition-colors"
                            onClick={closeMenu}
                          >
                            {getModuleTitle(mod.id)}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Контакт */}
            <Link
              href="/contact"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              onClick={closeMenu}
            >
              {t('nav.contact')}
            </Link>

            {/* Авторизация */}
            {token ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--primary-color)] hover:underline transition-colors"
                onClick={closeMenu}
              >
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/login-client"
                  className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  onClick={closeMenu}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register-client"
                  className="text-sm font-medium text-[var(--primary-color)] hover:underline transition-colors"
                  onClick={closeMenu}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Селектор языка */}
          <div className="mt-6 md:mt-0 md:ml-4">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}