import { getTranslations } from 'next-intl/server';
import PricingCards from '@/features/billing/ui/PricingCards';
import { redirectToSubscribe } from '@/features/billing/actions';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `https://gopublica.com/${locale}/pricing`,
      languages: {
        en: '/en/pricing',
        de: '/de/pricing',
        pl: '/pl/pricing',
        ru: '/ru/pricing',
        ua: '/ua/pricing',
        es: '/es/pricing',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: `https://gopublica.com/${locale}/pricing`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default async function PricingPage() {
  const t = await getTranslations('pricing');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '39',
      priceId: 'price_1TcswhLqSWMZrmileY2yjcHb',
      features: t.raw('plans.basic.features') as string[],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '69',
      priceId: 'price_1TcsyDLqSWMZrmilWUKPEXnJ',
      popular: true,
      features: t.raw('plans.pro.features') as string[],
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GoPublica',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price,
      priceCurrency: 'EUR',
      eligibleSubscriptionDuration: 'P1M',
      description: plan.features.join(', '),
      ...(plan.popular ? { category: 'popular' } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('title')}</h1>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto mb-12">{t('subtitle')}</p>
        <PricingCards plans={plans} onSelect={redirectToSubscribe} />
        <p className="text-[var(--text-muted)] text-sm mt-8">{t('footerNotice')}</p>
      </section>
    </>
  );
}