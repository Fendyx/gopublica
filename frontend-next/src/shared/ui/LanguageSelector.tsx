"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Globe, ChevronDown } from "lucide-react";

// Сопоставление кода языка с полным названием
const LANGUAGE_NAMES: Record<string, string> = {
  de: "Deutsch",
  ua: "Українська",
  en: "English",
  pl: "Polski",
  ru: "Русский",
  es: "Español",
};

export default function LanguageSelector() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрывать меню при клике вне компонента
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/") || "/";
    router.push(newPath);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:bg-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
        <span className="min-w-[80px] text-left">
          {LANGUAGE_NAMES[locale] || locale.toUpperCase()}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-full min-w-[160px] origin-top-right rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2"
        >
          {routing.locales.map((l) => (
            <li
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => switchLocale(l)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-[var(--muted)] ${
                l === locale
                  ? "font-semibold text-[var(--primary)] bg-[var(--muted)]/50"
                  : "text-[var(--text)]"
              }`}
            >
              {/* Можно добавить иконку-флаг через react-icons, если нужно */}
              <span className="flex-1">{LANGUAGE_NAMES[l] || l.toUpperCase()}</span>
              {l === locale && (
                <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}