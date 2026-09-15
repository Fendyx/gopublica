import type { Metadata } from 'next';
import { getLegalContent } from '@/content/legal';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Services – GoPublica',
    description: 'GoPublica offers comprehensive SaaS solutions for restaurants, beauty salons, auto service shops, and e-commerce stores.',
    alternates: {
      canonical: `${baseUrl}/${locale}/services`,
      languages: {
        en: `${baseUrl}/en/services`,
        de: `${baseUrl}/de/services`,
        pl: `${baseUrl}/pl/services`,
        ru: `${baseUrl}/ru/services`,
        ua: `${baseUrl}/ua/services`,
        es: `${baseUrl}/es/services`,
      },
    },
    openGraph: {
      title: 'Services – GoPublica',
      description: 'GoPublica offers comprehensive SaaS solutions for restaurants, beauty salons, auto service shops, and e-commerce stores.',
      url: `${baseUrl}/${locale}/services`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, 'services');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'GoPublica Services',
    url: 'https://gopublica.com/services',
    about: {
      '@type': 'Organization',
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
