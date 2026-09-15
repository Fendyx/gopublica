/**
 * Locale-aware content loader for legal/informational pages.
 * Falls back to 'en' if the requested locale is not available.
 */

// Services
import { servicesPl } from './services/services-pl';
import { servicesEn } from './services/services-en';
import { servicesUa } from './services/services-ua';
import { servicesDe } from './services/services-de';
import { servicesRu } from './services/services-ru';
import { servicesEs } from './services/services-es';

// Delivery
import { deliveryPl } from './delivery/delivery-pl';
import { deliveryEn } from './delivery/delivery-en';
import { deliveryUa } from './delivery/delivery-ua';
import { deliveryDe } from './delivery/delivery-de';
import { deliveryRu } from './delivery/delivery-ru';
import { deliveryEs } from './delivery/delivery-es';

// Payment
import { paymentPl } from './payment/payment-pl';
import { paymentEn } from './payment/payment-en';
import { paymentUa } from './payment/payment-ua';
import { paymentDe } from './payment/payment-de';
import { paymentRu } from './payment/payment-ru';
import { paymentEs } from './payment/payment-es';

// Imprint
import { imprintPl } from './imprint/imprint-pl';
import { imprintEn } from './imprint/imprint-en';
import { imprintUa } from './imprint/imprint-ua';
import { imprintDe } from './imprint/imprint-de';
import { imprintRu } from './imprint/imprint-ru';
import { imprintEs } from './imprint/imprint-es';

// Privacy
import { privacyPl } from './privacy/privacy-pl';
import { privacyEn } from './privacy/privacy-en';
import { privacyUa } from './privacy/privacy-ua';
import { privacyDe } from './privacy/privacy-de';
import { privacyRu } from './privacy/privacy-ru';
import { privacyEs } from './privacy/privacy-es';

// Terms
import { termsPl } from './terms/terms-pl';
import { termsEn } from './terms/terms-en';
import { termsUa } from './terms/terms-ua';
import { termsDe } from './terms/terms-de';
import { termsRu } from './terms/terms-ru';
import { termsEs } from './terms/terms-es';

export type LegalPage = 'services' | 'delivery' | 'payment' | 'imprint' | 'privacy' | 'terms';

const contentMap: Record<LegalPage, Record<string, string>> = {
  services: { pl: servicesPl, en: servicesEn, ua: servicesUa, de: servicesDe, ru: servicesRu, es: servicesEs },
  delivery: { pl: deliveryPl, en: deliveryEn, ua: deliveryUa, de: deliveryDe, ru: deliveryRu, es: deliveryEs },
  payment:  { pl: paymentPl,  en: paymentEn,  ua: paymentUa,  de: paymentDe,  ru: paymentRu,  es: paymentEs },
  imprint:  { pl: imprintPl,  en: imprintEn,  ua: imprintUa,  de: imprintDe,  ru: imprintRu,  es: imprintEs },
  privacy:  { pl: privacyPl,  en: privacyEn,  ua: privacyUa,  de: privacyDe,  ru: privacyRu,  es: privacyEs },
  terms:    { pl: termsPl,    en: termsEn,    ua: termsUa,    de: termsDe,    ru: termsRu,    es: termsEs },
};

const PAGE_LABELS: Record<LegalPage, string> = {
  services: 'Our Services',
  delivery: 'Delivery Information',
  payment: 'Payment Methods',
  imprint: 'Imprint',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
};

export function getLegalContent(locale: string, page: LegalPage): string {
  const pageContent = contentMap[page];
  return pageContent[locale] ?? pageContent['en'];
}

export interface SearchResult {
  page: LegalPage;
  pageTitle: string;
  matchedText: string;
  context: string;
  score: number;
}

/**
 * Strip markdown syntax and extract plain text from content.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/^\s*[-*+]\s+/gm, '')      // list markers
    .replace(/^\s*\d+\.\s+/gm, '')      // numbered list markers
    .replace(/^\|.*\|$/gm, (line) =>    // table rows
      line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim()
    )
    .replace(/^---$/gm, '')             // horizontal rules
    .replace(/\n{2,}/g, '\n')           // multiple newlines
    .trim();
}

/**
 * Find the best matching snippet around a match position.
 */
function extractContext(text: string, matchStart: number, matchEnd: number, radius = 120): string {
  const start = Math.max(0, matchStart - radius);
  const end = Math.min(text.length, matchEnd + radius);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet += '…';

  // Clean up markdown in snippet
  snippet = stripMarkdown(snippet);
  return snippet.trim();
}

/**
 * Simple fuzzy-ish text search across all legal documents.
 * Returns results sorted by relevance score.
 */
export function searchLegalContent(
  query: string,
  locale: string,
  labels?: Record<LegalPage, string>
): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const pageLabels = labels ?? PAGE_LABELS;
  const results: SearchResult[] = [];

  const pages = Object.keys(contentMap) as LegalPage[];

  for (const page of pages) {
    // Use the best available locale content
    const rawContent = contentMap[page][locale] ?? contentMap[page]['en'];
    if (!rawContent) continue;

    const plainText = stripMarkdown(rawContent).toLowerCase();

    // Score: count how many query words appear, with position weighting
    let totalScore = 0;
    let firstMatchPos = Infinity;

    for (const word of queryWords) {
      const idx = plainText.indexOf(word);
      if (idx !== -1) {
        // Words found earlier score higher
        totalScore += 100 - Math.min(idx, 100);
        if (idx < firstMatchPos) firstMatchPos = idx;
      }
    }

    // Bonus for exact phrase match
    const exactIdx = plainText.indexOf(normalizedQuery);
    if (exactIdx !== -1) {
      totalScore += 200;
      if (exactIdx < firstMatchPos) firstMatchPos = exactIdx;
    }

    if (totalScore === 0) continue;

    // Find the best matching position for context extraction
    const matchStart = firstMatchPos === Infinity ? 0 : firstMatchPos;
    const matchEnd = matchStart + normalizedQuery.length;
    const context = extractContext(rawContent, matchStart, matchEnd);

    results.push({
      page,
      pageTitle: pageLabels[page],
      matchedText: context,
      context,
      score: totalScore,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get all page slugs for search indexing.
 */
export function getAllLegalPageSlugs(): LegalPage[] {
  return Object.keys(contentMap) as LegalPage[];
}
