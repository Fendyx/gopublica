'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { AlertTriangle, X } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const { user, logout } = useTenantAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      // Пока удаление не реализовано на бекенде – просто разлогиниваем
      // В будущем вызовем tenantApi.deleteAccount()
      await new Promise((resolve) => setTimeout(resolve, 500));
      logout();
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('errorDelete'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold">{t('name')}</label>
            <p className="mt-1 text-lg">{user.name}</p>
          </div>
          <div>
            <label className="text-sm font-semibold">{t('email')}</label>
            <p className="mt-1 text-lg">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-semibold">{t('phone')}</label>
            <p className="mt-1 text-lg">{user.phone || '—'}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {t('editHint')}
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            {t('dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            {t('deleteWarning')}
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
            onClick={() => setShowDeleteModal(true)}
          >
            {t('deleteAccount')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t('confirmDelete')}</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {t('deleteIrreversible')}
            </p>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                {t('keepAccount')}
              </Button>
              <Button
                variant="outline"
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? t('deleting') : t('confirmDeleteBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}