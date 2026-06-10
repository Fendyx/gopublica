'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/Button';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';

export default function LoginClientForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login } = useTenantAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await tenantApi.login({ email, password });
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || t('errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">{t('loginTitle')}</h1>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
          <div>
            <label className="text-sm font-semibold">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('loading') : t('loginBtn')}
          </Button>
          <p className="text-center text-sm text-[var(--text-muted)]">
            {t('noAccount')}{' '}
            <a href="/register-client" className="text-[var(--primary-color)] hover:underline">
              {t('register')}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}