/**
 * Global locale catalog — single source of truth for all supported languages.
 *
 * Used by backend routes for search queries, default translations, validation,
 * and seed data. Each locale entry defines:
 *  - code   : ISO 639-1 code (must match the Map keys in Mongoose models)
 *  - label  : Human-readable name in the language itself
 *  - flag   : Emoji flag for UI display (optional, backend-only convenience)
 */

const GLOBAL_LOCALES = [
  { code: 'pl', label: 'Polski',       flag: '🇵🇱' },
  { code: 'en', label: 'English',      flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',      flag: '🇩🇪' },
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
  { code: 'ua', label: 'Українська',   flag: '🇺🇦' },
  { code: 'es', label: 'Español',      flag: '🇪🇸' },
];

/** All supported locale codes as a plain string array. */
const LOCALE_CODES = GLOBAL_LOCALES.map((l) => l.code);

/** Returns the human-readable label for a locale code, or the code itself if unknown. */
function getLabelForLocale(code) {
  const found = GLOBAL_LOCALES.find((l) => l.code === code);
  return found ? found.label : code;
}

/** Returns true if `code` is a valid global locale code. */
function isValidLocale(code) {
  return LOCALE_CODES.includes(code);
}

module.exports = { GLOBAL_LOCALES, LOCALE_CODES, getLabelForLocale, isValidLocale };
