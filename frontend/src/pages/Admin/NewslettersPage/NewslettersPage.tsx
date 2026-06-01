import { useState, useEffect } from 'react';
import { Plus, Trash2, Send, AlertCircle, Megaphone, Info } from 'lucide-react';
import { fetchNews, createNews, deleteNews } from '../../../features/crm/api/newsApi';
import type { NewsPost, NewsType } from '../../../features/crm/types';
import './NewslettersPage.css';

const typeOptions: { value: NewsType; label: string; icon: React.ReactNode }[] = [
  { value: 'info', label: 'Информация', icon: <Info size={16} /> },
  { value: 'marketing', label: 'Маркетинг', icon: <Megaphone size={16} /> },
  { value: 'alert', label: 'Предупреждение', icon: <AlertCircle size={16} /> },
];

export default function NewslettersPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'info' as NewsType,
    title: '',
    content: '',
    targetTenants: '',
    targetTariffs: '',
    showToNewClients: false,
    expiresAt: '',
  });

  const loadNews = async () => {
    try {
      const data = await fetchNews();
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const resetForm = () => {
    setForm({
      type: 'info',
      title: '',
      content: '',
      targetTenants: '',
      targetTariffs: '',
      showToNewClients: false,
      expiresAt: '',
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await createNews({
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
        targetTenants: form.targetTenants
          ? form.targetTenants.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        targetTariffs: form.targetTariffs
          ? form.targetTariffs.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        showToNewClients: form.showToNewClients,
        expiresAt: form.expiresAt || null,
      });
      resetForm();
      await loadNews();
    } catch (err: any) {
      alert(err.message || 'Ошибка при создании');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить новость?')) return;
    try {
      await deleteNews(id);
      await loadNews();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const iconForType = (type: NewsType) => typeOptions.find(t => t.value === type)?.icon || null;

  if (loading) return <div className="text-center py-10">Загрузка новостей...</div>;

  return (
    <div className="newsletters-page">
      <div className="page-header flex flex-between mb-6">
        <h2>Gopublica — Новости</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Закрыть' : 'Новая новость'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h3 className="card-title mb-4">Создать новость</h3>
          <div className="grid-2 mb-4">
            <div>
              <label className="label">Тип</label>
              <div className="flex gap-2 mt-1">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: opt.value })}
                    className={`badge ${form.type === opt.value ? 'badge-primary' : 'badge-outline'}`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Истекает (опционально)</label>
              <input
                type="datetime-local"
                className="input"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Заголовок *</label>
            <input
              type="text"
              className="input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="label">Содержание *</label>
            <textarea
              className="textarea"
              rows={4}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>
          <div className="grid-2 mb-4">
            <div>
              <label className="label">Target Tenants (через запятую)</label>
              <input
                type="text"
                className="input"
                value={form.targetTenants}
                onChange={e => setForm({ ...form, targetTenants: e.target.value })}
                placeholder="pizzeria-brava, sushi-master"
              />
            </div>
            <div>
              <label className="label">Target Tariffs (через запятую)</label>
              <input
                type="text"
                className="input"
                value={form.targetTariffs}
                onChange={e => setForm({ ...form, targetTariffs: e.target.value })}
                placeholder="basic, pro"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showToNewClients}
                onChange={e => setForm({ ...form, showToNewClients: e.target.checked })}
              />
              <span className="label" style={{ margin: 0 }}>Показывать новым клиентам</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Send size={14} /> {saving ? 'Отправка...' : 'Опубликовать'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Отмена</button>
          </div>
        </form>
      )}

      {/* Список новостей */}
      {news.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-muted">Нет опубликованных новостей.</p>
        </div>
      ) : (
        <div className="news-list">
          {news.map(item => (
            <article key={item._id} className={`card news-card news-card--${item.type}`}>
              <div className="flex flex-between mb-2">
                <div className="flex items-center gap-2">
                  {iconForType(item.type)}
                  <h4>{item.title}</h4>
                </div>
                <button
                  className="btn btn-icon btn-ghost"
                  onClick={() => handleDelete(item._id)}
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-muted text-sm whitespace-pre-line">{item.content}</p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                {item.targetTenants?.length ? <span>• Tenants: {item.targetTenants.join(', ')}</span> : null}
                {item.targetTariffs?.length ? <span>• Tariffs: {item.targetTariffs.join(', ')}</span> : null}
                {item.expiresAt ? <span>• До: {new Date(item.expiresAt).toLocaleDateString()}</span> : <span>• Без срока</span>}
                <span>• {item.showToNewClients ? 'Всем' : 'Только существующим'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}