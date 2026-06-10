'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import ConsentCheckboxes from '@/shared/ui/ConsentCheckboxes';

export default function RegisterClientForm() {
  const t = useTranslations('register');
  const router = useRouter();
  const { login } = useTenantAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatId, setVatId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAccepted) {
      setError(t('acceptTermsAndPrivacy'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await tenantApi.register({
        name,
        email,
        password,
        companyName,
        vatId,
        termsAccepted,
        privacyAccepted,
        marketingConsent,
      });
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || t('errorRegister'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">{t('title')}</h1>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
          <div>
            <label className="text-sm font-semibold">{t('name')}</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div>
            <label className="text-sm font-semibold">{t('email')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div>
            <label className="text-sm font-semibold">{t('password')}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">{t('companyName')}</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            <div>
              <label className="text-sm font-semibold">{t('vatId')}</label>
              <input type="text" value={vatId} onChange={e => setVatId(e.target.value)}
                className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
          </div>

          <ConsentCheckboxes
            termsChecked={termsAccepted}
            privacyChecked={privacyAccepted}
            marketingChecked={marketingConsent}
            onTermsChange={setTermsAccepted}
            onPrivacyChange={setPrivacyAccepted}
            onMarketingChange={setMarketingConsent}
            showMarketing={true}
          />

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[var(--primary-color)] text-white py-2.5 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? t('creating') : t('registerBtn')}
          </button>
          <p className="text-center text-sm text-[var(--text-muted)]">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login-client" className="text-[var(--primary-color)] hover:underline">
              {t('login')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}