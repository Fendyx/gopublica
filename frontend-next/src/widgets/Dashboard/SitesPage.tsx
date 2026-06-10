'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/shared/ui/Card';
import { Globe, Clock, ExternalLink } from 'lucide-react';

export default function SitesPage() {
  const t = useTranslations('sites');

  // Показываем только одну карточку-заглушку
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>

      <Card className="border-2 border-dashed border-[var(--border)] bg-[var(--surface)]">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center mb-4">
            <Globe size={32} className="text-[var(--primary-color)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('siteInProgress')}</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-4">
            {t('siteInProgressDesc')}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
            <Clock size={16} />
            <span>{t('comingSoon')}</span>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {t('questionsContact')}{' '}
            <a href="mailto:support@gopublica.com" className="text-[var(--primary-color)] hover:underline">
              support@gopublica.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}