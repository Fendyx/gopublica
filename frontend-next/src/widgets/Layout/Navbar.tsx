'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LanguageSelector from '@/shared/ui/LanguageSelector';
import { useTenantAuthStore } from '@/store/tenantAuthStore';

export default function Navbar() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { token } = useTenantAuthStore(); // 👈 проверяем клиентскую авторизацию

  const closeMenu = () => setIsOpen(false);

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

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-xl font-bold text-[var(--text)]"
          onClick={closeMenu}
        >
          GoPublica
        </Link>

        <button
          className="hamburger md:hidden p-2 rounded-md hover:bg-[var(--bg)] text-[var(--text)]"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={closeMenu}
          />
        )}

        <div
          ref={menuRef}
          className={`fixed top-0 right-0 h-full w-72 bg-[var(--surface)] shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col pt-20 px-6 md:static md:h-auto md:w-auto md:shadow-none md:transform-none md:flex-row md:items-center md:gap-8 md:pt-0 md:px-0 md:bg-transparent ${
            isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-[var(--bg)] md:hidden"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

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
            <Link
              href="/contact"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              onClick={closeMenu}
            >
              {t('nav.contact')}
            </Link>

            {/* 👇 Авторизация */}
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

          <div className="mt-6 md:mt-0 md:ml-4">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}