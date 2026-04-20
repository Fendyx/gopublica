import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/store'; // Подключаем стор

type Status = 'Новый' | 'В работе' | 'Закрыт' | 'Отказ';

interface Lead {
  _id: string; 
  name: string;
  phone: string;
  source: string;
  status: Status;
  comment: string;
  price?: number;
  businessType?: string;
  servicesRequested?: string[];
  createdAt?: string; 
}

const STATUS_COLOR: Record<Status, string> = {
  'Новый':    '#2563eb',
  'В работе': '#d97706',
  'Закрыт':   '#16a34a',
  'Отказ':    '#dc2626',
};

const STATUSES: Status[] = ['Новый', 'В работе', 'Закрыт', 'Отказ'];
const BUSINESS_TYPES = ['Ресторан', 'Барбершоп', 'Цветочный магазин', 'Другое'];
const AVAILABLE_SERVICES = ['Меню', 'Бронирование столиков', 'Админ панель', 'Онлайн-запись (Барбер/Салон)', 'Интернет-магазин', 'Мультиязычность'];

const API_URL = 'http://localhost:5000/api/leads'; 

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | 'Все'>('Все');
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const { token } = useAuthStore(); // Берем токен
  
  // Универсальные заголовки для запросов
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };

  const [newLead, setNewLead] = useState({ 
    name: '', phone: '', source: 'Сайт', comment: '', price: 0, businessType: 'Другое', servicesRequested: [] as string[]
  });

  // ЗАГРУЗКА
  useEffect(() => {
    fetch(API_URL, { headers }) // Передаем токен
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeads(data);
        } else {
          setLeads([]);
        }
        setLoading(false);
      })
      .catch(err => console.error("Ошибка загрузки:", err));
  }, [token]);

  const filtered = filter === 'Все' ? leads : leads.filter(l => l.status === filter);

  const toggleService = (service: string) => {
    setNewLead(prev => {
      const isSelected = prev.servicesRequested.includes(service);
      return {
        ...prev,
        servicesRequested: isSelected 
          ? prev.servicesRequested.filter(s => s !== service) 
          : [...prev.servicesRequested, service]
      };
    });
  };

  // ОТПРАВКА
  const addLead = async () => {
    if (!newLead.name || !newLead.phone) return;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers, // Передаем токен
        body: JSON.stringify(newLead) 
      });
      const savedLead = await response.json();
      setLeads(prev => [savedLead, ...prev]);
      setNewLead({ name: '', phone: '', source: 'Сайт', comment: '', price: 0, businessType: 'Другое', servicesRequested: [] });
      setShowForm(false);
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  };

  // ОБНОВЛЕНИЕ СТАТУСА
  const changeStatus = async (id: string, status: Status) => {
    setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
    if (selectedLead?._id === id) {
      setSelectedLead(prev => prev ? { ...prev, status } : null);
    }
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers, // Передаем токен
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
    }
  };

  // УДАЛЕНИЕ ЛИДА
  const deleteLead = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого лида навсегда?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers // Передаем токен
      });
      setLeads(prev => prev.filter(l => l._id !== id));
      setSelectedLead(null);
    } catch (error) {
      console.error("Ошибка при удалении:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('ru-RU');
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Лиды (CRM)</h1>
          <p style={{ color: 'var(--color-text-muted, gray)' }}>Управление входящими заявками</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '8px 16px', background: 'black', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          {showForm ? '✕ Отмена' : '+ Добавить лид'}
        </button>
      </div>

      {/* ФОРМА СОЗДАНИЯ */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '24px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Имя/Компания *</label>
            <input type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Телефон *</label>
            <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Тип бизнеса</label>
            <select value={newLead.businessType} onChange={e => setNewLead({...newLead, businessType: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none', background: 'white' }}>
              {BUSINESS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Бюджет проекта (€ / $)</label>
            <input type="number" value={newLead.price} onChange={e => setNewLead({...newLead, price: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none' }} />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Что нужно сделать? (Можно выбрать несколько)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {AVAILABLE_SERVICES.map(service => (
                <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', background: '#f5f5f5', padding: '6px 12px', borderRadius: '20px' }}>
                  <input 
                    type="checkbox" 
                    checked={newLead.servicesRequested.includes(service)}
                    onChange={() => toggleService(service)}
                  />
                  {service}
                </label>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Комментарий</label>
            <textarea rows={3} value={newLead.comment} onChange={e => setNewLead({...newLead, comment: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button onClick={addLead} style={{ padding: '10px 20px', background: 'black', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Сохранить лид</button>
          </div>
        </div>
      )}

      {/* ФИЛЬТРЫ */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['Все', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: filter === s ? 'black' : 'white',
              color: filter === s ? '#fff' : 'black',
              border: '1px solid #ddd',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {s}
            <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.75 }}>
              {s === 'Все' ? leads.length : leads.filter(l => l.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* ТАБЛИЦА */}
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9f9f9' }}>
              {['Клиент', 'Тип бизнеса', 'Телефон', 'Бюджет', 'Статус', 'Дата'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>Загрузка из базы данных...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'gray' }}>Нет лидов</td></tr>
            ) : (
              filtered.map((lead, i) => (
                <tr 
                  key={lead._id} 
                  onClick={() => setSelectedLead(lead)} 
                  style={{ 
                    borderBottom: i < filtered.length - 1 ? '1px solid #eee' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f4f4f4'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 500 }}>{lead.name}</td>
                  <td style={{ padding: '14px 20px', color: 'gray' }}>{lead.businessType || 'Другое'}</td>
                  <td style={{ padding: '14px 20px', color: 'gray' }}>{lead.phone}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{lead.price ? `$${lead.price}` : '-'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()} 
                      onChange={e => changeStatus(lead._id, e.target.value as Status)}
                      style={{
                        border: `1px solid ${STATUS_COLOR[lead.status] || '#000'}40`,
                        background: (STATUS_COLOR[lead.status] || '#000') + '15',
                        color: STATUS_COLOR[lead.status] || '#000',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'gray', whiteSpace: 'nowrap' }}>{formatDate(lead.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ЛИДА */}
      {selectedLead && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            background: 'white', padding: '30px', borderRadius: '16px', 
            width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedLead(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'gray' }}
            >
              ✕
            </button>
            
            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2 style={{ margin: '0 0 5px 0' }}>{selectedLead.name}</h2>
              <span style={{ 
                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                backgroundColor: STATUS_COLOR[selectedLead.status] + '20',
                color: STATUS_COLOR[selectedLead.status] 
              }}>
                {selectedLead.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: 'gray' }}>Телефон</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 500 }}>{selectedLead.phone}</p>
              </div>
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: 'gray' }}>Бюджет</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 500 }}>{selectedLead.price ? `$${selectedLead.price}` : 'Не указан'}</p>
              </div>
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: 'gray' }}>Тип бизнеса</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 500 }}>{selectedLead.businessType || 'Другое'}</p>
              </div>
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: 'gray' }}>Дата добавления</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 500 }}>{formatDate(selectedLead.createdAt)}</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'gray' }}>Запрашиваемые услуги</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedLead.servicesRequested && selectedLead.servicesRequested.length > 0 ? (
                  selectedLead.servicesRequested.map(service => (
                    <span key={service} style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                      {service}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: 'gray' }}>Услуги не выбраны</span>
                )}
              </div>
            </div>

            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'gray' }}>Комментарий менеджера</p>
              <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
                {selectedLead.comment || 'Нет комментариев.'}
              </p>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => deleteLead(selectedLead._id)} 
                style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🗑 Удалить лид
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}