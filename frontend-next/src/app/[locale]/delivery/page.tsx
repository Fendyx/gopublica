import type { Metadata } from 'next';
import { getLegalContent } from '@/content/legal';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Delivery Information – GoPublica',
    description: 'Learn about delivery options powered by Furgonetka: parcel lockers, courier delivery, and pickup points across Central and Eastern Europe.',
    alternates: {
      canonical: `${baseUrl}/${locale}/delivery`,
      languages: {
        en: `${baseUrl}/en/delivery`,
        de: `${baseUrl}/de/delivery`,
        pl: `${baseUrl}/pl/delivery`,
        ru: `${baseUrl}/ru/delivery`,
        ua: `${baseUrl}/ua/delivery`,
        es: `${baseUrl}/es/delivery`,
      },
    },
    openGraph: {
      title: 'Delivery Information – GoPublica',
      description: 'Learn about delivery options powered by Furgonetka: parcel lockers, courier delivery, and pickup points.',
      url: `${baseUrl}/${locale}/delivery`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function DeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, 'delivery');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Delivery Information',
    url: 'https://gopublica.com/delivery',
    about: {
      '@type': 'Thing',
      name: 'GoPublica',
      description: 'Delivery services powered by Furgonetka',
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
