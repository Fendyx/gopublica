import type { Metadata } from 'next';
import { getLegalContent } from '@/content/legal';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Terms of Service – GoPublica',
    description: 'The terms and conditions for using GoPublica SaaS platform.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/terms`,
      languages: {
        en: `${baseUrl}/en/legal/terms`,
        de: `${baseUrl}/de/legal/terms`,
        pl: `${baseUrl}/pl/legal/terms`,
        ru: `${baseUrl}/ru/legal/terms`,
        ua: `${baseUrl}/ua/legal/terms`,
        es: `${baseUrl}/es/legal/terms`,
      },
    },
    openGraph: {
      title: 'Terms of Service – GoPublica',
      description: 'The terms and conditions for using GoPublica SaaS platform.',
      url: `${baseUrl}/${locale}/legal/terms`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, 'terms');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    url: 'https://gopublica.com/legal/terms',
    about: {
      '@type': 'Thing',
      name: 'GoPublica',
      description: 'SaaS platform for business digitalization',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPage content={content} />
    </>
  );
}
