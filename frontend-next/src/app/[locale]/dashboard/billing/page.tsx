import { getTranslations } from 'next-intl/server';
import BillingPage from '@/widgets/Dashboard/BillingPage';

export default async function BillingDashboardPage() {
  const t = await getTranslations('billing');
  return <BillingPage />;
}