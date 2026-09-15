'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, CheckCircle2, Globe, Paintbrush, FileText, MessageCircle, Link2, Truck, CreditCard } from 'lucide-react';
import { fetchTenantSettings, updateTenantSettings } from '@/entities/tenantAdmin/api';
import type { TenantSettings } from '@/entities/tenantAdmin/types';

const NICHE_OPTIONS = ['food', 'restaurant', 'beauty', 'auto', 'ecommerce'];
const CURRENCY_OPTIONS = ['PLN', 'EUR', 'USD', 'UAH', 'GBP', 'CZK', 'CHF'];
const HERO_STYLES = ['centered', 'split', 'video', 'slider', 'image-bg', 'compact'];
const LOCALE_OPTIONS = [
  { code: 'pl', label: 'Polski' }, { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' }, { code: 'ru', label: 'Русский' },
  { code: 'ua', label: 'Українська' }, { code: 'es', label: 'Español' },
];

interface Props {
  tenantId: string;
  onRefresh: () => void;
  key: number;
}

type SettingsTab = 'general' | 'domain' | 'theme' | 'locales' | 'features' | 'legal' | 'notifications' | 'navigation' | 'logistics' | 'payments';

export default function SettingsTab({ tenantId, onRefresh: _onRefresh, key: _key }: Props) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTenantSettings(tenantId);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateTenantSettings(tenantId, settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (path: string, value: any) => {
    if (!settings) return;
    const keys = path.split('.');
    const next = { ...settings } as any;
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = { ...obj[keys[i]] };
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setSettings(next);
  };

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading settings…</div>;
  if (!settings) return <div className="py-10 text-center text-sm text-red-500">No settings found</div>;

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'domain', label: 'Domain & SEO', icon: Link2 },
    { id: 'theme', label: 'Theme', icon: Paintbrush },
    { id: 'locales', label: 'Locales', icon: Globe },
    { id: 'features', label: 'Features', icon: CheckCircle2 },
    { id: 'legal', label: 'Legal', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: MessageCircle },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
              activeTab === id ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{settings.businessName || 'Unnamed Tenant'}</span>
          <span className="rounded-full border px-2 py-0.5 text-xs border-[var(--border)]">{settings.niche}</span>
          <span className="text-xs text-[var(--text-muted)]">{settings.tenantId}</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 size={14} /> Saved</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
            <Save size={14} />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Field label="Business Name" value={settings.businessName} onChange={(v) => update('businessName', v)} />
          <Field label="Niche" type="select" value={settings.niche} options={NICHE_OPTIONS} onChange={(v) => update('niche', v)} />
          <Field label="Phone" value={settings.phone} onChange={(v) => update('phone', v)} />
          <Field label="Email" value={settings.email} onChange={(v) => update('email', v)} />
          <Field label="Address" value={settings.address} onChange={(v) => update('address', v)} className="md:col-span-2" />
          <Field label="Hours" value={settings.hours} onChange={(v) => update('hours', v)} />
          <Field label="Google Maps URL" value={settings.googleMapsUrl} onChange={(v) => update('googleMapsUrl', v)} />
          <Field label="Logo URL" value={settings.logoUrl} onChange={(v) => update('logoUrl', v)} className="md:col-span-2" />
          <Field label="Favicon URL" value={settings.faviconUrl} onChange={(v) => update('faviconUrl', v)} className="md:col-span-2" />
        </div>
      )}

      {/* Domain & SEO Tab */}
      {activeTab === 'domain' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Field label="Domain" value={settings.domain || ''} onChange={(v) => update('domain', v || null)} placeholder="e.g. sushi.gopublica.com" />
          <Field label="Aliases (comma-separated)" value={(settings.aliases || []).join(', ')} onChange={(v) => update('aliases', v ? v.split(',').map((s: string) => s.trim()) : [])} />
          <Field label="SEO Title" value={settings.seoTitle} onChange={(v) => update('seoTitle', v)} className="md:col-span-2" />
          <Field label="SEO Description" value={settings.seoDescription} onChange={(v) => update('seoDescription', v)} multiline className="md:col-span-2" />
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Field label="Primary Color" type="color" value={settings.theme?.primary || '#ff0505'} onChange={(v) => update('theme.primary', v)} />
          <Field label="Accent Color" type="color" value={settings.theme?.accent || '#F1A208'} onChange={(v) => update('theme.accent', v)} />
          <Field label="Font Heading" value={settings.theme?.fontHeading || ''} onChange={(v) => update('theme.fontHeading', v)} />
          <Field label="Hero Style" type="select" value={settings.theme?.heroStyle || 'video'} options={HERO_STYLES} onChange={(v) => update('theme.heroStyle', v)} />
          <Field label="Hero Video URL" value={settings.theme?.heroVideoUrl || ''} onChange={(v) => update('theme.heroVideoUrl', v)} className="md:col-span-2" />
          <Field label="Hero Poster URL" value={settings.theme?.heroPosterUrl || ''} onChange={(v) => update('theme.heroPosterUrl', v)} className="md:col-span-2" />
          <Field label="Menu Style" type="select" value={settings.theme?.menuStyle || 'grid'} options={['grid', 'list']} onChange={(v) => update('theme.menuStyle', v)} />
          <Field label="Gallery Style" type="select" value={settings.theme?.galleryStyle || 'bento'} options={['bento', 'masonry']} onChange={(v) => update('theme.galleryStyle', v)} />
          <Field label="Border Radius" type="select" value={settings.theme?.radius || 'lg'} options={['none', 'sm', 'md', 'lg', 'xl']} onChange={(v) => update('theme.radius', v)} />
          <Field label="Page BG Color" type="color" value={settings.theme?.pageBgColor || ''} onChange={(v) => update('theme.pageBgColor', v)} />
          <Field label="Category BG Color" type="color" value={settings.theme?.categoryBgColor || ''} onChange={(v) => update('theme.categoryBgColor', v)} />
        </div>
      )}

      {/* Locales Tab */}
      {activeTab === 'locales' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Active Locales</label>
            <div className="flex flex-wrap gap-2">
              {LOCALE_OPTIONS.map(({ code, label }) => (
                <button key={code}
                  onClick={() => {
                    const current = settings.activeLocales || [];
                    update('activeLocales', current.includes(code) ? current.filter((l) => l !== code) : [...current, code]);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    (settings.activeLocales || []).includes(code) ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'border-[var(--border)] hover:bg-[var(--bg)]'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Default Locale" type="select" value={settings.defaultLocale || 'pl'} options={LOCALE_OPTIONS.map((l) => l.code)} onChange={(v) => update('defaultLocale', v)} />
          <Field label="Primary Currency" type="select" value={settings.primaryCurrency || 'PLN'} options={CURRENCY_OPTIONS} onChange={(v) => update('primaryCurrency', v)} />
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Toggle label="Menu" checked={settings.features?.hasMenu ?? true} onChange={(v) => update('features.hasMenu', v)} />
          <Toggle label="Booking" checked={settings.features?.hasBooking ?? true} onChange={(v) => update('features.hasBooking', v)} />
          <Toggle label="Gallery" checked={settings.features?.hasGallery ?? true} onChange={(v) => update('features.hasGallery', v)} />
          <Toggle label="Delivery" checked={settings.features?.hasDelivery ?? false} onChange={(v) => update('features.hasDelivery', v)} />
          <Toggle label="Click & Collect" checked={settings.features?.hasClickCollect ?? false} onChange={(v) => update('features.hasClickCollect', v)} />
          <Toggle label="Online Ordering" checked={settings.features?.hasOnlineOrdering ?? false} onChange={(v) => update('features.hasOnlineOrdering', v)} />
          <Toggle label="Job Applications" checked={settings.features?.hasJobApplications ?? false} onChange={(v) => update('features.hasJobApplications', v)} />
          <Toggle label="Category Nav" checked={settings.features?.showCategoryNav ?? false} onChange={(v) => update('features.showCategoryNav', v)} />
        </div>
      )}

      {/* Legal Tab */}
      {activeTab === 'legal' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Field label="Legal Company Name" value={settings.legal?.legalCompanyName || ''} onChange={(v) => update('legal.legalCompanyName', v)} className="md:col-span-2" />
          <Field label="NIP" value={settings.legal?.nip || ''} onChange={(v) => update('legal.nip', v)} />
          <Field label="REGON" value={settings.legal?.regon || ''} onChange={(v) => update('legal.regon', v)} />
          <Field label="KRS" value={settings.legal?.krs || ''} onChange={(v) => update('legal.krs', v)} />
          <Field label="Representative Name" value={settings.legal?.representativeName || ''} onChange={(v) => update('legal.representativeName', v)} />
          <Field label="Representative Role" value={settings.legal?.representativeRole || ''} onChange={(v) => update('legal.representativeRole', v)} />
          <Field label="Postal Code" value={settings.legal?.postalCode || ''} onChange={(v) => update('legal.postalCode', v)} />
          <Field label="City" value={settings.legal?.city || ''} onChange={(v) => update('legal.city', v)} />
          <Toggle label="Show Terms" checked={settings.legal?.showTerms ?? true} onChange={(v) => update('legal.showTerms', v)} />
          <Toggle label="Show Privacy" checked={settings.legal?.showPrivacy ?? true} onChange={(v) => update('legal.showPrivacy', v)} />
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Toggle label="Booking Sound" checked={settings.notifications?.booking?.sound ?? true} onChange={(v) => update('notifications.booking.sound', v)} />
          <Toggle label="Booking Message" checked={settings.notifications?.booking?.message ?? true} onChange={(v) => update('notifications.booking.message', v)} />
          <Toggle label="Telegram Enabled" checked={settings.notifications?.telegram?.enabled ?? false} onChange={(v) => update('notifications.telegram.enabled', v)} />
          <Toggle label="Telegram: New Order" checked={settings.notifications?.telegram?.events?.newOrder ?? true} onChange={(v) => update('notifications.telegram.events.newOrder', v)} />
          <Toggle label="Telegram: New Reservation" checked={settings.notifications?.telegram?.events?.newReservation ?? true} onChange={(v) => update('notifications.telegram.events.newReservation', v)} />
          <Toggle label="Telegram: New Job Application" checked={settings.notifications?.telegram?.events?.newJobApplication ?? true} onChange={(v) => update('notifications.telegram.events.newJobApplication', v)} />
          <Toggle label="Telegram: New Partner Request" checked={settings.notifications?.telegram?.events?.newPartnerRequest ?? true} onChange={(v) => update('notifications.telegram.events.newPartnerRequest', v)} />
        </div>
      )}

      {/* Logistics Tab */}
      {activeTab === 'logistics' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Toggle label="Logistics Enabled" checked={settings.logistics?.enabled ?? false} onChange={(v) => update('logistics.enabled', v)} />
          <Field label="Provider" type="select" value={settings.logistics?.provider || 'none'} options={['none', 'furgonetka']} onChange={(v) => update('logistics.provider', v)} />
          <Field label="Environment" type="select" value={settings.logistics?.env || 'sandbox'} options={['sandbox', 'production']} onChange={(v) => update('logistics.env', v)} />
          <Field label="Map API Key" value={settings.logistics?.mapApiKey || ''} onChange={(v) => update('logistics.mapApiKey', v)} />
          <Field label="Client ID" value={settings.logistics?.auth?.clientId || ''} onChange={(v) => update('logistics.auth.clientId', v)} />
          <Field label="Client Secret" value={settings.logistics?.auth?.clientSecret || ''} onChange={(v) => update('logistics.auth.clientSecret', v)} />
          <Field label="Username" value={settings.logistics?.auth?.username || ''} onChange={(v) => update('logistics.auth.username', v)} />
          <Field label="Password" type="password" value={settings.logistics?.auth?.password || ''} onChange={(v) => update('logistics.auth.password', v)} />
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
          <Field label="Stripe Account ID" value={settings.payments?.stripeAccountId || ''} onChange={(v) => update('payments.stripeAccountId', v)} />
          <Field label="Platform Fee %" type="number" value={String(settings.payments?.platformFeePercent ?? 5)} onChange={(v) => update('payments.platformFeePercent', Number(v))} />
          <Toggle label="Charges Enabled" checked={settings.payments?.chargesEnabled ?? false} onChange={(v) => update('payments.chargesEnabled', v)} />
          <Toggle label="Payouts Enabled" checked={settings.payments?.payoutsEnabled ?? false} onChange={(v) => update('payments.payoutsEnabled', v)} />
          <Toggle label="Onboarding Complete" checked={settings.payments?.onboardingComplete ?? false} onChange={(v) => update('payments.onboardingComplete', v)} />
        </div>
      )}
    </div>
  );
}

// ─── Reusable field components ────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', options, placeholder, multiline, className }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; options?: string[]; placeholder?: string; multiline?: boolean; className?: string;
}) {
  return (
    <label className={`text-sm ${className || ''}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {type === 'select' && options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'color' ? (
        <div className="flex items-center gap-2">
          <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded border border-[var(--border)]" />
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
        </div>
      ) : multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
      ) : type === 'password' ? (
        <input type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
      ) : type === 'number' ? (
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
      )}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-[var(--primary-color)]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}
