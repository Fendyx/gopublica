import { getTranslations } from 'next-intl/server';
import SettingsPage from '@/widgets/Dashboard/SettingsPage';

export default async function SettingsDashboardPage() {
  const t = await getTranslations('settings');
  return <SettingsPage />;
}