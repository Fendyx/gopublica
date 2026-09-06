'use client';

import { useState } from 'react';
import {
  Building2,
  Globe as GlobeIcon,
  Link as LinkIcon,
  Utensils,
  Sparkles,
  Car,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { cn } from '@/shared/lib/utils';
import type { Site, SiteNiche, SiteType } from '@/entities/subscription/model/types';
import { SitePreview } from './SitePreview';
import { SiteStatusBadge } from './SiteStatusBadge';
import { SiteQuickActions } from './SiteQuickActions';
import { SiteDeploymentLogs } from './SiteDeploymentLogs';

const nicheIcons: Record<SiteNiche, React.ElementType> = {
  food: Utensils,
  restaurant: Utensils,
  beauty: Sparkles,
  auto: Car,
  ecommerce: ShoppingBag,
};

const nicheLabels: Record<SiteNiche, string> = {
  food: 'Food & Drink',
  restaurant: 'Restaurant',
  beauty: 'Beauty',
  auto: 'Auto',
  ecommerce: 'E-commerce',
};

const typeLabels: Record<SiteType, string> = {
  primary: 'Primary',
  subdomain: 'Subdomain',
  landing: 'Landing',
  microsite: 'Microsite',
};

interface SiteCardProps {
  site: Site;
}

function NicheBadge({ niche }: { niche: SiteNiche }) {
  const Icon = nicheIcons[niche] || GlobeIcon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)]">
      <Icon size={9} className="shrink-0" />
      {nicheLabels[niche] || niche}
    </span>
  );
}

function TypeBadge({ type }: { type: SiteType }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)]">
      <Building2 size={9} className="shrink-0" />
      {typeLabels[type] || type}
    </span>
  );
}

export function SiteCard({ site }: SiteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
      <CardContent className="p-0 flex flex-col md:flex-row">
        {/* Visual Preview — left on desktop, top on mobile */}
        <div className="md:w-[45%] shrink-0">
          <SitePreview site={site} />
        </div>

        {/* Content — right on desktop, bottom on mobile */}
        <div className="flex-1 p-5">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <SiteStatusBadge status={site.status} showPulse />
            <NicheBadge niche={site.niche} />
            <TypeBadge type={site.type} />
          </div>

          {/* Site name + domain */}
          <h3 className="text-lg font-bold text-[var(--text)] truncate mb-1">
            {site.name}
          </h3>
          {site.domain && (
            <p className="text-sm text-[var(--text-muted)] truncate flex items-center gap-1 mb-4">
              <GlobeIcon size={12} className="shrink-0" />
              {site.domain}
            </p>
          )}
          {!site.domain && site.subdomain && (
            <p className="text-sm text-[var(--text-muted)] truncate flex items-center gap-1 mb-4">
              <LinkIcon size={12} className="shrink-0" />
              {site.subdomain}.gopublica.com
            </p>
          )}
          {!site.domain && !site.subdomain && <div className="mb-4" />}

          {/* Quick Actions */}
          <SiteQuickActions
            site={site}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>

        {/* Expandable Deployment Logs */}
        {isExpanded && (
          <div className="px-5 pb-5">
            <SiteDeploymentLogs logs={site.deploymentLogs || []} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
