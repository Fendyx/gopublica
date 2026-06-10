import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers'; // для получения токена? Пока клиентский, но мы можем сделать серверный layout, который пробрасывает данные. Для простоты пока клиентский чек в children.
import { redirect } from 'next/navigation';
import DashboardOverview from '@/widgets/Dashboard/OverviewPage';

export default async function DashboardHomePage() {
  // На сервере мы не можем проверить zustand хранилище (localStorage). Нужно middleware для защиты или передавать токен через cookie.
  // Пока сделаем клиентскую проверку внутри виджета. Поэтому просто рендерим виджет.
  return <DashboardOverview />;
}