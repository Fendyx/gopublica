import { getTranslations } from 'next-intl/server';
import { SolutionsHub } from '@/widgets/SolutionsHub/SolutionsHub';

export default async function SolutionsPage() {
  const t = await getTranslations('solutions');
  
  return (
    <main className="min-h-screen bg-base pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          
          <h1 className="text-4xl font-extrabold tracking-tight text-body sm:text-5xl">
            {t('page.title')}
          </h1>
          
          <p className="mt-4 text-xl text-body-muted max-w-3xl mx-auto">
            {t('page.subtitle')}
          </p>
          
        </div>
        <SolutionsHub />
      </div>
    </main>
  );
}