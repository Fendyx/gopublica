import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { solutions } from '@/content/solutions/modules';
import { SolutionDetail } from '@/widgets/SolutionDetail/SolutionDetail';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SolutionDetailPage({ params }: Props) {
  const { slug } = await params;
  const mod = solutions.find(m => m.slug === slug);
  if (!mod) notFound();

  const t = await getTranslations('solutions.modules');
  const globalT = await getTranslations('solutions');
  // Здесь можно передать данные в клиентский компонент
  return <SolutionDetail module={mod} />;
}