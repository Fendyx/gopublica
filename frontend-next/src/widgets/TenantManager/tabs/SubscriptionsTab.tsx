'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { fetchSubscription } from '@/entities/tenantAdmin/api';
import type { Subscription } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function SubscriptionsTab({ tenantId, key: _key }: Props) {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSubscription(tenantId);
      setSub(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  if (!sub) return (
    <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">
      <CreditCard size={32} className="mx-auto mb-3 opacity-40" />
      No subscription
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard size={18} /> Subscription</h3>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Plan</label>
            <div className="text-lg font-semibold">{sub.plan}</div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Status</label>
            <div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                sub.status === 'active' ? 'border-emerald-500/30 text-emerald-600' :
                sub.status === 'past_due' ? 'border-yellow-500/30 text-yellow-600' :
                'border-gray-300 text-gray-500'
              }`}>{sub.status}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Stripe Customer</label>
            <div className="text-sm font-mono">{sub.stripeCustomerId || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Period End</label>
            <div className="text-sm">{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}</div>
          </div>
        </div>
        {sub.paymentHistory?.length ? (
          <div className="mt-4">
            <label className="text-xs text-[var(--text-muted)]">Payment History</label>
            <div className="mt-2 space-y-1">
              {sub.paymentHistory.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{new Date(p.date).toLocaleDateString()} — {p.note || '—'}</span>
                  <span className="font-medium">{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
