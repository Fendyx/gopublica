import type { Metadata } from 'next';
import { getLegalContent } from '@/content/legal';
import LegalPage from '@/widgets/LegalPage/LegalPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Payment Methods – GoPublica',
    description: 'GoPublica supports 100+ payment methods through Stripe: credit cards, BLIK, Apple Pay, Google Pay, bank transfers, and more.',
    alternates: {
      canonical: `${baseUrl}/${locale}/payment`,
      languages: {
        en: `${baseUrl}/en/payment`,
        de: `${baseUrl}/de/payment`,
        pl: `${baseUrl}/pl/payment`,
        ru: `${baseUrl}/ru/payment`,
        ua: `${baseUrl}/ua/payment`,
        es: `${baseUrl}/es/payment`,
      },
    },
    openGraph: {
      title: 'Payment Methods – GoPublica',
      description: 'GoPublica supports 100+ payment methods through Stripe: credit cards, BLIK, Apple Pay, Google Pay, bank transfers, and more.',
      url: `${baseUrl}/${locale}/payment`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function PaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, 'payment');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Payment Methods',
    url: 'https://gopublica.com/payment',
    about: {
      '@type': 'Thing',
      name: 'GoPublica',
      description: 'Online payment methods powered by Stripe',
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
