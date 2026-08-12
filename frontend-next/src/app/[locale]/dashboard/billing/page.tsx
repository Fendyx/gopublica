import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import BillingPage from '@/widgets/Dashboard/BillingPage';

// Карта валют (такая же, как на странице Pricing)
const COUNTRY_CURRENCY: Record<string, string> = {
  PL: 'PLN', DE: 'EUR', CZ: 'CZK', ES: 'EUR', FR: 'EUR', IT: 'EUR', NL: 'EUR',
  UA: 'UAH', US: 'USD', GB: 'GBP', CH: 'CHF',
};

export default async function BillingDashboardPage() {
  // Оставляем инициализацию переводов на случай, если ты захочешь добавить метаданные страницы
  const t = await getTranslations('billing');

  // Определяем страну и валюту по IP пользователя
  const headersList = await headers();
  const countryCode = (headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry') || 'PL').toUpperCase();
  const ipCurrency = COUNTRY_CURRENCY[countryCode] || 'EUR';

  // Передаем ipCurrency как пропс в клиентский компонент
  return <BillingPage ipCurrency={ipCurrency} />;
}