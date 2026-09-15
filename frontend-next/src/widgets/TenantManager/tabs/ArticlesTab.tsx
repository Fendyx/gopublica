'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { fetchArticles } from '@/entities/tenantAdmin/api';
import type { Article } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function ArticlesTab({ tenantId, key: _key }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchArticles(tenantId, { page, limit: 50 });
      setArticles(data.articles || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId, page]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2"><FileText size={18} /> Articles ({total})</h3>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Prev</button>
          <span className="text-xs text-[var(--text-muted)]">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={articles.length < 50}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
        </div>
      </div>
      {articles.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No articles</div>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <div key={a._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-[var(--text-muted)]">/{a.slug} {a.author ? `· ${a.author}` : ''}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'Draft'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
