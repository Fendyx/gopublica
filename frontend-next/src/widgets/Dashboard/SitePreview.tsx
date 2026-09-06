'use client';

import { useState, useCallback } from 'react';
import {
  Globe as GlobeIcon,
  Utensils,
  Sparkles,
  Car,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Site, SiteNiche } from '@/entities/subscription/model/types';

const nicheIcons: Record<SiteNiche, React.ElementType> = {
  food: Utensils,
  restaurant: Utensils,
  beauty: Sparkles,
  auto: Car,
  ecommerce: ShoppingBag,
};

const nicheGradients: Record<SiteNiche, string> = {
  food: 'from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
  restaurant:
    'from-amber-100 to-red-100 dark:from-amber-900/20 dark:to-red-900/20',
  beauty: 'from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20',
  auto: 'from-slate-100 to-blue-100 dark:from-slate-900/20 dark:to-blue-900/20',
  ecommerce:
    'from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20',
};

const nicheIconColors: Record<SiteNiche, string> = {
  food: 'text-amber-600 dark:text-amber-400',
  restaurant: 'text-red-600 dark:text-red-400',
  beauty: 'text-pink-600 dark:text-pink-400',
  auto: 'text-blue-600 dark:text-blue-400',
  ecommerce: 'text-emerald-600 dark:text-emerald-400',
};

interface SitePreviewProps {
  site: Site;
}

export function SitePreview({ site }: SitePreviewProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const previewUrl = site.liveUrl || site.stagingUrl;
  const showIframe = previewUrl && !loadFailed;

  const handleIframeError = useCallback(() => {
    setLoadFailed(true);
  }, []);
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  const Icon = nicheIcons[site.niche] || GlobeIcon;
  const gradient = nicheGradients[site.niche] || nicheGradients.food;
  const iconColor = nicheIconColors[site.niche] || nicheIconColors.food;

  return (
    <div className="relative w-full h-full min-h-[200px] md:min-h-[240px] overflow-hidden bg-[var(--bg)]">
      {showIframe ? (
        <>
          <iframe
            src={previewUrl}
            title={`Preview of ${site.name}`}
            loading="lazy"
            sandbox="allow-same-origin"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
            className={cn(
              'absolute top-0 left-0 w-[400%] h-[400%] origin-top-left pointer-events-none transition-opacity duration-300',
              iframeLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{ transform: 'scale(0.25)' }}
          />
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg)]">
              <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Loading preview…</span>
            </div>
          )}
        </>
      ) : (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br',
            gradient
          )}
        >
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              'bg-white/80 dark:bg-white/10 shadow-sm'
            )}
          >
            <Icon size={28} className={iconColor} />
          </div>
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {site.name}
          </span>
        </div>
      )}

      {/* Subtle gradient overlay at bottom for polish */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
}
