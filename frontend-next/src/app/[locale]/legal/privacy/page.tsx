import type { Metadata } from 'next';
import { getLegalContent } from '@/content/legal';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Privacy Policy – GoPublica',
    description: 'How GoPublica collects, uses, and protects your personal data in compliance with GDPR.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/privacy`,
      languages: {
        en: `${baseUrl}/en/legal/privacy`,
        de: `${baseUrl}/de/legal/privacy`,
        pl: `${baseUrl}/pl/legal/privacy`,
        ru: `${baseUrl}/ru/legal/privacy`,
        ua: `${baseUrl}/ua/legal/privacy`,
        es: `${baseUrl}/es/legal/privacy`,
      },
    },
    openGraph: {
      title: 'Privacy Policy – GoPublica',
      description: 'How GoPublica collects, uses, and protects your personal data in compliance with GDPR.',
      url: `${baseUrl}/${locale}/legal/privacy`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, 'privacy');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    url: 'https://gopublica.com/legal/privacy',
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
