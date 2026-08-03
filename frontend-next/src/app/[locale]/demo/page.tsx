// src/app/[locale]/demo/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import DemoQuizWidget from '@/widgets/DemoQuiz/DemoQuizWidget';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'demoQuiz.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `https://gopublica.com/${locale}/demo`,
      languages: {
        en: '/en/demo',
        de: '/de/demo',
        pl: '/pl/demo',
        ru: '/ru/demo',
        ua: '/ua/demo',
        es: '/es/demo',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://gopublica.com/${locale}/demo`,
      siteName: 'GoPublica',
      locale,
      type: 'website',
    },
  };
}

export default function DemoPage() {
  return <DemoQuizWidget />;
}
