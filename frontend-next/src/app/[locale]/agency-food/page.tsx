import { getTranslations } from 'next-intl/server';
import AgencyFoodPage from '@/widgets/AgencyFood/AgencyFoodPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'agencyFood' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://gopublica.com/${locale}/agency-food`,
      locale,
      type: 'website',
    },
  };
}

export default function AgencyFoodPageRoute() {
  return <AgencyFoodPage />;
}