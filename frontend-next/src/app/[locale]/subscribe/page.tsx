import { getTranslations } from 'next-intl/server';
import SubscribePageClient from './SubscribePageClient';

export default async function SubscribePage() {
  const t = await getTranslations('subscribe');
  return <SubscribePageClient />;
}