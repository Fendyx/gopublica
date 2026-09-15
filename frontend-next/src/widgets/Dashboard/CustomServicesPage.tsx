'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { customServiceApi } from '@/entities/customService/api/customServiceApi';
import type { CustomService } from '@/entities/customService/model/types';
import { Wrench } from 'lucide-react';
import SummaryStats from './CustomServicesPage/SummaryStats';
import ServiceItemCard from './CustomServicesPage/ServiceItemCard';
import PaymentModal from './CustomServicesPage/PaymentModal';

export default function CustomServicesPage() {
  const t = useTranslations('customServices');
  const user = useTenantAuthStore((s) => s.user);
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingService, setPayingService] = useState<CustomService | null>(null);

  const fetchServices = useCallback(async () => {
    if (!user) return;
    try {
      const data = await customServiceApi.list();
      setServices(data);
    } catch {
      // Silently fail - empty state handles this
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handlePaySuccess = useCallback(() => {
    setPayingService(null);
    fetchServices(); // Refresh list
  }, [fetchServices]);

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t('subtitle')}
        </p>
      </div>

      {/* Summary stats */}
      <section>
        <SummaryStats services={services} loading={loading} />
      </section>

      {/* Services list */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">
          {t('yourServices')}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg)] flex items-center justify-center mb-4">
              <Wrench className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">{t('empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceItemCard
                key={service._id}
                service={service}
                onPay={setPayingService}
              />
            ))}
          </div>
        )}
      </section>

      {/* Payment modal */}
      {payingService && (
        <PaymentModal
          service={payingService}
          onClose={() => setPayingService(null)}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}
