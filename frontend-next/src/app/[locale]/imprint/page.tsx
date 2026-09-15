import type { Metadata } from 'next';
import { getLegalContent } from '@/content/legal';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Imprint – GoPublica',
    description: 'Company information and legal details for GoPublica Andrii Knapp.',
    alternates: {
      canonical: `${baseUrl}/${locale}/imprint`,
      languages: {
        en: `${baseUrl}/en/imprint`,
        de: `${baseUrl}/de/imprint`,
        pl: `${baseUrl}/pl/imprint`,
        ru: `${baseUrl}/ru/imprint`,
        ua: `${baseUrl}/ua/imprint`,
        es: `${baseUrl}/es/imprint`,
      },
    },
    openGraph: {
      title: 'Imprint – GoPublica',
      description: 'Company information and legal details for GoPublica Andrii Knapp.',
      url: `${baseUrl}/${locale}/imprint`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function ImprintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, 'imprint');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GoPublica Andrii Knapp',
    url: 'https://gopublica.com',
    email: 'support@gopublica.com',
    taxID: '6772525332',
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
