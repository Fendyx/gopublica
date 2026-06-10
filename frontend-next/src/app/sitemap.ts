import { routing } from '@/i18n/routing';

const BASE_URL = 'https://gopublica.com';

export default async function sitemap() {
  const staticPages = [
    '',
    '/pricing',
    '/contact',
    '/privacy',
    '/terms',
    '/agency-food',
    '/agency-beauty-grooming',
    '/agency-other',
  ];

  const entries = [];

  for (const locale of routing.locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: page === '' ? 1 : 0.8,
      });
    }
  }

  return entries;
}