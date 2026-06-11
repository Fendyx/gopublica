import { useTranslations } from 'next-intl';

export default function TestPage() {
  const t = useTranslations();
  return <div>Current locale: {t('nav.home')}</div>;
}