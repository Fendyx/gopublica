import { getTranslations } from 'next-intl/server';
import PricingCards from '@/features/billing/ui/PricingCards';
import { redirectToSubscribe } from '@/features/billing/actions';
import type { Metadata } from 'next';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanFeature = {
  text: string;
  included: boolean;
  /** Marks a "killer feature" — rendered with an accent pill */
  hot?: boolean;
};

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceId: string;
  popular?: boolean;
  features: PlanFeature[];
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
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
  } as Record<string, string>,  // ← добавить
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const t = await getTranslations('pricing');

  const plans: Plan[] = [
    {
      id: 'starter',
      name: t('plans.starter.name'),
      tagline: t('plans.starter.tagline'),
      price: '39',
      priceId: 'price_1TcswhLqSWMZrmileY2yjcHb',
      features: [
        { text: t('features.adminPanel'),        included: true },
        { text: t('features.booking'),            included: true },
        { text: t('features.gallery'),            included: true },
        { text: t('features.domainSsl'),          included: true },
        { text: t('features.basicStats'),         included: true },
        { text: t('features.location1'),          included: true },
        { text: t('features.supportHours'),       included: true },
        // ↓ locked — these are the upgrade hooks
        { text: t('features.onlineOrders'),       included: false, hot: true },
        { text: t('features.location3'),          included: false },
        { text: t('features.advancedAnalytics'),  included: false },
      ],
    },
    {
      id: 'growth',
      name: t('plans.growth.name'),
      tagline: t('plans.growth.tagline'),
      price: '69',
      priceId: 'price_1TcsyDLqSWMZrmilWUKPEXnJ',
      popular: true,
      features: [
        { text: t('features.adminPanel'),          included: true },
        { text: t('features.booking'),             included: true },
        { text: t('features.gallery'),             included: true },
        { text: t('features.domainSsl'),           included: true },
        { text: t('features.advancedAnalytics'),   included: true },
        { text: t('features.location3'),           included: true },
        { text: t('features.prioritySupport'),     included: true },
        { text: t('features.onlineOrders'),        included: true, hot: true },
        // ↓ locked — upgrade hooks toward Scale
        { text: t('features.locationUnlimited'),   included: false },
        { text: t('features.dedicatedManager'),    included: false },
        { text: t('features.whiteLabel'),          included: false },
      ],
    },
    {
      id: 'scale',
      name: t('plans.scale.name'),
      tagline: t('plans.scale.tagline'),
      price: '129',
      priceId: 'price_SCALE_PLACEHOLDER', // ← replace with real Stripe price ID
      features: [
        { text: t('features.adminPanel'),          included: true },
        { text: t('features.booking'),             included: true },
        { text: t('features.gallery'),             included: true },
        { text: t('features.domainSsl'),           included: true },
        { text: t('features.advancedAnalytics'),   included: true },
        { text: t('features.locationUnlimited'),   included: true },
        { text: t('features.onlineOrders'),        included: true, hot: true },
        { text: t('features.dedicatedManager'),    included: true },
        { text: t('features.whiteLabel'),          included: true },
        { text: t('features.customIntegrations'),  included: true },
      ],
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
      description: plan.features
        .filter((f) => f.included)
        .map((f) => f.text)
        .join(', '),
      ...(plan.popular ? { category: 'popular' } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-5 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">{t('title')}</h1>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto mb-2">{t('subtitle')}</p>
        <p className="text-sm text-green-600 font-semibold mb-10">{t('trialNote')}</p>

        <PricingCards plans={plans} onSelect={redirectToSubscribe} />

        <p className="text-[var(--text-muted)] text-sm mt-10">{t('footerNotice')}</p>
      </section>
    </>
  );
}