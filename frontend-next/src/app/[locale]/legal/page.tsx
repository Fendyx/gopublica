import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  Rocket,
  Package,
  CreditCard,
  Building2,
  Shield,
  FileText,
  ArrowRight,
} from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = 'https://gopublica.com';
  return {
    title: 'Legal & Information – GoPublica',
    description: 'All legal documents, service descriptions, delivery information, payment methods, and company details for GoPublica.',
    alternates: {
      canonical: `${baseUrl}/${locale}/legal`,
      languages: {
        en: `${baseUrl}/en/legal`,
        de: `${baseUrl}/de/legal`,
        pl: `${baseUrl}/pl/legal`,
        ru: `${baseUrl}/ru/legal`,
        ua: `${baseUrl}/ua/legal`,
        es: `${baseUrl}/es/legal`,
      },
    },
    openGraph: {
      title: 'Legal & Information – GoPublica',
      description: 'All legal documents, service descriptions, delivery information, payment methods, and company details.',
      url: `${baseUrl}/${locale}/legal`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  services: Rocket,
  delivery: Package,
  payment: CreditCard,
  imprint: Building2,
  privacy: Shield,
  terms: FileText,
};

const DOCUMENTS = [
  { slug: 'services', descKey: 'servicesDesc' },
  { slug: 'delivery', descKey: 'deliveryDesc' },
  { slug: 'payment', descKey: 'paymentDesc' },
  { slug: 'imprint', descKey: 'imprintDesc' },
  { slug: 'privacy', descKey: 'privacyDesc' },
  { slug: 'terms', descKey: 'termsDesc' },
] as const;

export default async function LegalHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations('legal');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legal & Information Center',
    url: 'https://gopublica.com/legal',
    description: 'All legal documents, service descriptions, and company information for GoPublica.',
    provider: {
      '@type': 'Organization',
      name: 'GoPublica',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-2xl">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
          {t('hubTitle')}
        </h1>
        <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
          {t('hubDescription')}
        </p>

        <div className="grid gap-3">
          {DOCUMENTS.map((doc) => {
            const Icon = ICON_MAP[doc.slug];
            return (
              <Link
                key={doc.slug}
                href={`/legal/${doc.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--primary-color)]/30 hover:shadow-md"
              >
                <div className="flex-none w-10 h-10 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center">
                  {Icon && <Icon className="w-5 h-5 text-[var(--primary-color)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-[var(--text)] group-hover:text-[var(--primary-color)] transition-colors">
                    {t(doc.slug)}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {t(doc.descKey)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary-color)] group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </article>
    </>
  );
}
