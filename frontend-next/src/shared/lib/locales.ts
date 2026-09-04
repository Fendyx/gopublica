/**
 * Global locale catalog — single source of truth for all supported languages.
 *
 * Keep in sync with `backend/config/locales.js` and
 * `gopublica-core/src/shared/lib/locales.ts`.
 */

export interface LocaleEntry {
  code: string;
  label: string;
  flag: string;
}

export const GLOBAL_LOCALES: LocaleEntry[] = [
  { code: 'pl', label: 'Polski',       flag: '🇵🇱' },
  { code: 'en', label: 'English',      flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',      flag: '🇩🇪' },
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
  { code: 'ua', label: 'Українська',   flag: '🇺🇦' },
  { code: 'es', label: 'Español',      flag: '🇪🇸' },
] as const;

/** All supported locale codes as a plain string array. */
export const LOCALE_CODES: string[] = GLOBAL_LOCALES.map((l) => l.code);

/**
 * Display-name lookup derived from the global catalog.
 * Usage: `LANGUAGE_NAMES[locale]` → "Polski"
 */
export const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  GLOBAL_LOCALES.map((l) => [l.code, l.label]),
);

/** Returns the human-readable label for a locale code, or the code itself if unknown. */
export function getLabelForLocale(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

/** Returns true if `code` is a valid global locale code. */
export function isValidLocale(code: string): boolean {
  return LOCALE_CODES.includes(code);
}
