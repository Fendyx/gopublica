'use client';

import { useCallback, useEffect, useState } from 'react';
import { Images } from 'lucide-react';
import { fetchGallery } from '@/entities/tenantAdmin/api';
import type { GalleryItem } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function GalleryTab({ tenantId, key: _key }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchGallery(tenantId);
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Images size={18} /> Gallery ({items.length})</h3>
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No gallery items</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item._id} className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="aspect-square bg-[var(--bg)]">
                {item.image ? (
                  <img src={item.image} alt={item.caption || ''} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
                    <Images size={24} />
                  </div>
                )}
              </div>
              {item.caption && <div className="px-2 py-1.5 text-xs text-[var(--text-muted)] truncate">{item.caption}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
