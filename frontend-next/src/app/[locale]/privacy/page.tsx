import type { Metadata } from 'next';
import { privacyEn } from '@/content/legal/privacy-en';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Privacy Policy – GoPublica',
    description: 'How GoPublica collects, uses, and protects your personal data in compliance with GDPR.',
    alternates: {
      canonical: `${baseUrl}/${locale}/privacy`,
      languages: {
        en: `${baseUrl}/en/privacy`,
        de: `${baseUrl}/de/privacy`,
        pl: `${baseUrl}/pl/privacy`,
        ru: `${baseUrl}/ru/privacy`,
        ua: `${baseUrl}/ua/privacy`,
        es: `${baseUrl}/es/privacy`,
      },
    },
    openGraph: {
      title: 'Privacy Policy – GoPublica',
      description: 'How GoPublica collects, uses, and protects your personal data in compliance with GDPR.',
      url: `${baseUrl}/${locale}/privacy`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    url: 'https://gopublica.com/privacy',
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
      <LegalPage content={privacyEn} />
    </>
  );
}