import { getTranslations } from 'next-intl/server';
import ContactPageWidget from '@/widgets/ContactPage/ContactPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `https://gopublica.com/${locale}/contact`,
      languages: {
        en: '/en/contact',
        de: '/de/contact',
        pl: '/pl/contact',
        ru: '/ru/contact',
        ua: '/ua/contact',
        es: '/es/contact',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: `https://gopublica.com/${locale}/contact`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default function ContactPage() {
  return (
    <>
      {/* JSON‑LD Organization с контактами */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'GoPublica',
            url: 'https://gopublica.com',
            contactPoint: [
              {
                '@type': 'ContactPoint',
                contactType: 'Sales',
                email: 'support@gopublica.com',
                telephone: '+49 176 12 345 678',
                availableLanguage: ['English', 'German', 'Polish'],
              },
            ],
            sameAs: [
              'https://t.me/yourhandle',
              'https://wa.me/4917612345678',
            ],
          }),
        }}
      />
      <ContactPageWidget />
    </>
  );
}