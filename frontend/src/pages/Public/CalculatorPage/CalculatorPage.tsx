import { useState } from 'react';

const SERVICES = [
  { id: 'landing',    label: 'Лендинг',           price: 50000 },
  { id: 'corporate',  label: 'Корпоративный сайт', price: 150000 },
  { id: 'ecommerce',  label: 'Интернет-магазин',   price: 250000 },
  { id: 'webapp',     label: 'Веб-платформа',      price: 400000 },
];

const EXTRAS = [
  { id: 'seo',     label: 'SEO-оптимизация',    price: 20000 },
  { id: 'cms',     label: 'Система управления',  price: 30000 },
  { id: 'design',  label: 'Уникальный дизайн',   price: 40000 },
  { id: 'support', label: 'Поддержка 3 мес.',    price: 15000 },
];

export default function CalculatorPage() {
  const [serviceId, setServiceId] = useState('landing');
  const [extras, setExtras] = useState<Set<string>>(new Set());

  const basePrice = SERVICES.find(s => s.id === serviceId)?.price ?? 0;
  
  // ИСПРАВЛЕНИЕ: Используем Array.from(extras) вместо [...extras]
  const extrasTotal = Array.from(extras).reduce((sum, id) => {
    return sum + (EXTRAS.find(e => e.id === id)?.price ?? 0);
  }, 0);
  
  const total = basePrice + extrasTotal;

  const toggleExtra = (id: string) => {
    setExtras(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ padding: '60px 48px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Калькулятор стоимости</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '48px' }}>
        Выберите тип проекта и дополнительные услуги, чтобы получить ориентировочную стоимость.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Слева: опции */}
        <div>
          <h3 style={{ marginBottom: '16px' }}>Тип проекта</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
            {SERVICES.map(s => (
              <label key={s.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                border: `1px solid ${serviceId === s.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: serviceId === s.id ? '#eff6ff' : 'var(--color-bg)',
                transition: 'all 0.15s',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="radio"
                    name="service"
                    value={s.id}
                    checked={serviceId === s.id}
                    onChange={() => setServiceId(s.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {s.label}
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  от {s.price.toLocaleString('ru-RU')} ₽
                </span>
              </label>
            ))}
          </div>

          <h3 style={{ marginBottom: '16px' }}>Дополнительно</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {EXTRAS.map(e => (
              <label key={e.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                border: `1px solid ${extras.has(e.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: extras.has(e.id) ? '#eff6ff' : 'var(--color-bg)',
                transition: 'all 0.15s',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={extras.has(e.id)}
                    onChange={() => toggleExtra(e.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {e.label}
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  +{e.price.toLocaleString('ru-RU')} ₽
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Справа: итоги */}
        <div>
          <div style={{
            position: 'sticky',
            top: '80px',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '28px',
            background: 'var(--color-bg)',
          }}>
            <h3 style={{ marginBottom: '20px' }}>Итог</h3>

            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              {SERVICES.find(s => s.id === serviceId)?.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <span>Базовая стоимость</span>
              <span style={{ fontWeight: 600 }}>{basePrice.toLocaleString('ru-RU')} ₽</span>
            </div>

            {/* ИСПРАВЛЕНИЕ: Используем Array.from(extras) для вывода списка выбранных услуг */}
            {Array.from(extras).map(id => {
              const extra = EXTRAS.find(e => e.id === id);
              if (!extra) return null;
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{extra.label}</span>
                  <span>+{extra.price.toLocaleString('ru-RU')} ₽</span>
                </div>
              );
            })}

            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}>
              <span style={{ fontWeight: 600 }}>Итого</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {total.toLocaleString('ru-RU')} ₽
              </span>
            </div>

            <button style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '15px' }}>
              Оставить заявку
            </button>

            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
              Точная стоимость определяется после брифа
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}