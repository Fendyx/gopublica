import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/store'; // Подключаем стор

interface Lead {
  _id: string;
  name: string;
  source: string;
  status: 'Новый' | 'В работе' | 'Закрыт' | 'Отказ';
  price?: number;
  createdAt?: string;
}

const STATUS_COLOR: Record<string, string> = {
  'Новый':     '#2563eb',
  'В работе':  '#d97706',
  'Закрыт':    '#16a34a',
  'Отказ':     '#dc2626',
};

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/leads' : '/api/leads';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { token } = useAuthStore(); // Достаем токен

  useEffect(() => {
    fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${token}` } // Передаем токен на бэкенд
    })
      .then(res => res.json())
      .then(data => {
        // Проверяем, что пришел массив, а не объект с ошибкой
        if (Array.isArray(data)) {
          setLeads(data);
        } else {
          setLeads([]);
        }
        setLoading(false);
      })
      .catch(err => console.error("Ошибка загрузки:", err));
  }, [token]);

  // --- ВЫЧИСЛЕНИЕ СТАТИСТИКИ НА ЛЕТУ ---
  const newLeadsCount = leads.filter(l => l.status === 'Новый').length;
  const inProgressCount = leads.filter(l => l.status === 'В работе').length;
  const closedCount = leads.filter(l => l.status === 'Закрыт').length;
  
  // Считаем выручку (сумма всех price у которых статус "Закрыт")
  const totalRevenue = leads
    .filter(l => l.status === 'Закрыт')
    .reduce((sum, lead) => sum + (lead.price || 0), 0);

  const STATS = [
    { label: 'Новых лидов', value: newLeadsCount, sub: 'ждут обработки', color: '#2563eb' },
    { label: 'В работе',    value: inProgressCount,  sub: 'активных сделок', color: '#d97706' },
    { label: 'Успешно закрыто', value: closedCount,  sub: 'всего проектов', color: '#16a34a' },
    { label: 'Выручка',     value: `$${totalRevenue.toLocaleString()}`, sub: 'с закрытых сделок', color: '#7c3aed' },
  ];

  // Берем только 5 самых последних лидов для таблицы
  const RECENT_LEADS = leads.slice(0, 5);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '4px' }}>Дашборд</h1>
      <p style={{ color: 'gray', marginBottom: '32px' }}>
        Добро пожаловать. Сводная информация по проектам вашей команды.
      </p>

      {loading ? (
        <p>Загрузка статистики...</p>
      ) : (
        <>
          {/* Блок со статистикой */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '24px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Таблица последних лидов */}
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Последние лиды</h3>
              <a href="/admin/leads" style={{ fontSize: '14px', textDecoration: 'none', color: '#2563eb' }}>Все лиды →</a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f9f9f9' }}>
                  {['Клиент', 'Источник', 'Статус', 'Дата'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #ddd' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_LEADS.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'gray' }}>Пока нет лидов</td></tr>
                ) : (
                  RECENT_LEADS.map((lead, i) => (
                    <tr key={lead._id} style={{ borderBottom: i < RECENT_LEADS.length - 1 ? '1px solid #eee' : 'none' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 500 }}>{lead.name}</td>
                      <td style={{ padding: '14px 24px', color: 'gray' }}>{lead.source || 'Не указан'}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                          background: (STATUS_COLOR[lead.status] || '#000') + '18',
                          color: STATUS_COLOR[lead.status] || '#000',
                        }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: 'gray' }}>{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}