import { useTranslation } from 'react-i18next';
import PublicGrid from '@/features/portfolio/PublicGrid';
import HeroSection from '@/features/home/HeroSection';

export default function HomePage() {
  // const { t } = useTranslation();

  return (
    <div>
      
      <HeroSection />
      {/* Portfolio Section (Тот самый блок, который мы вынесли) */}
      <PublicGrid />

      {/* Services */}
      <section style={{ padding: '100px 48px', background: 'var(--color-bg)' }}>
        <div className="container">
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '60px', 
            textAlign: 'center',
            fontWeight: 700 
          }}>
            Что мы делаем
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px' 
          }}>
            {[
              { title: 'Лендинги', desc: 'Высококонверсионные одностраничники для продуктов и услуг.' },
              { title: 'Корпоративные сайты', desc: 'Многостраничные сайты с CMS и системой управления контентом.' },
              { title: 'Веб-платформы', desc: 'Сложные SaaS-приложения, CRM, порталы и маркетплейсы.' },
            ].map(({ title, desc }) => (
              <div key={title} style={{
                padding: '40px',
                border: '1px solid var(--color-border)',
                borderRadius: '20px',
                background: 'var(--color-surface)',
                transition: 'transform 0.2s ease'
              }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 600 }}>{title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        padding: '80px 48px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '60px 100px' 
        }}>
          {[
            { value: '120+', label: 'проектов' },
            { value: '5 лет', label: 'на рынке' },
            { value: '98%', label: 'довольных клиентов' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 800, 
                color: 'var(--color-primary)',
                marginBottom: '8px'
              }}>
                {value}
              </div>
              <div style={{ 
                color: 'var(--color-text-muted)', 
                fontSize: '1rem', 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}