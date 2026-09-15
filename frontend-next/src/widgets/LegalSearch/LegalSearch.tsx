'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import {
  searchLegalContent,
  getAllLegalPageSlugs,
  type SearchResult,
  type LegalPage,
} from '@/content/legal';

interface LegalSearchProps {
  locale: string;
  labels?: Record<LegalPage, string>;
}

export default function LegalSearch({ locale, labels }: LegalSearchProps) {
  const t = useTranslations('legal');
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build page labels from translations if not provided
  const pageLabels: Record<LegalPage, string> = labels ?? {
    services: t('services'),
    delivery: t('delivery'),
    payment: t('payment'),
    imprint: t('imprint'),
    privacy: t('privacy'),
    terms: t('terms'),
  };

  const doSearch = useCallback(
    (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      const hits = searchLegalContent(q, locale, pageLabels);
      setResults(hits);
      setIsOpen(true);
      setSelectedIndex(-1);
    },
    [locale, pageLabels]
  );

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 200);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      // Navigation happens via Link
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Highlight matching text in snippet
  function highlightMatch(text: string, q: string): React.ReactNode {
    if (!q.trim()) return text;
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = words.some(w => part.toLowerCase() === w);
      return isMatch ? (
        <mark key={i} className="bg-[var(--primary-color)]/20 text-[var(--text)] rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      );
    });
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          className={cn(
            'w-full pl-11 pr-10 py-3 rounded-xl border bg-[var(--surface)] text-[var(--text)] text-sm',
            'placeholder:text-[var(--text-muted)]/60',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/30 focus:border-[var(--primary-color)]/50',
            'transition-all',
            isOpen && results.length > 0
              ? 'border-[var(--primary-color)]/50 rounded-b-none border-b-0'
              : 'border-[var(--border)]'
          )}
          aria-label={t('searchPlaceholder')}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/30 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full bg-[var(--bg)] border border-[var(--primary-color)]/50 border-t-0 rounded-b-xl shadow-xl overflow-hidden',
            'max-h-[60vh] overflow-y-auto'
          )}
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">{t('searchNoResults')}</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)]">
                  {t('searchResultsCount', { count: results.length })}
                </span>
              </div>
              <ul role="listbox">
                {results.map((result, idx) => (
                  <li key={result.page} role="option" aria-selected={idx === selectedIndex}>
                    <Link
                      href={`/legal/${result.page}`}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors border-b border-[var(--border)]/50 last:border-0',
                        idx === selectedIndex
                          ? 'bg-[var(--primary-color)]/10'
                          : 'hover:bg-[var(--surface)]'
                      )}
                    >
                      <FileText className="w-4 h-4 text-[var(--primary-color)] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--text)]">
                            {result.pageTitle}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                          {highlightMatch(result.matchedText, query)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
