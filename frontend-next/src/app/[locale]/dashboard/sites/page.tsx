import { getTranslations } from 'next-intl/server';
import SitesPage from '@/widgets/Dashboard/SitesPage';

export default async function SitesDashboardPage() {
  const t = await getTranslations('sites');
  return <SitesPage />;
}