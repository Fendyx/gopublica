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
      canonical: `${baseUrl}/${locale}/legal/imprint`,
      languages: {
        en: `${baseUrl}/en/legal/imprint`,
        de: `${baseUrl}/de/legal/imprint`,
        pl: `${baseUrl}/pl/legal/imprint`,
        ru: `${baseUrl}/ru/legal/imprint`,
        ua: `${baseUrl}/ua/legal/imprint`,
        es: `${baseUrl}/es/legal/imprint`,
      },
    },
    openGraph: {
      title: 'Imprint – GoPublica',
      description: 'Company information and legal details for GoPublica Andrii Knapp.',
      url: `${baseUrl}/${locale}/legal/imprint`,
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
