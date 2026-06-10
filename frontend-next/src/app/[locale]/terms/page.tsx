import type { Metadata } from 'next';
import { termsEn } from '@/content/legal/terms-en';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Terms of Service – GoPublica',
    description: 'The terms and conditions for using GoPublica SaaS platform.',
    alternates: {
      canonical: `${baseUrl}/${locale}/terms`,
      languages: {
        en: `${baseUrl}/en/terms`,
        de: `${baseUrl}/de/terms`,
        pl: `${baseUrl}/pl/terms`,
        ru: `${baseUrl}/ru/terms`,
        ua: `${baseUrl}/ua/terms`,
        es: `${baseUrl}/es/terms`,
      },
    },
    openGraph: {
      title: 'Terms of Service – GoPublica',
      description: 'The terms and conditions for using GoPublica SaaS platform.',
      url: `${baseUrl}/${locale}/terms`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default function TermsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    url: 'https://gopublica.com/terms',
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
      <LegalPage content={termsEn} />
    </>
  );
}