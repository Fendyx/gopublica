import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PublicGrid from '@/features/portfolio/PublicGrid';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '120px 48px 100px',
        textAlign: 'center',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h1 style={{ 
          fontSize: '4rem', 
          lineHeight: 1.05, 
          marginBottom: '24px', 
          letterSpacing: '-2px',
          fontWeight: 800,
          color: 'var(--color-text)' 
        }}>
          {t('hero.title')}
        </h1>
        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '1.25rem', 
          maxWidth: '600px', 
          margin: '0 auto 48px',
          lineHeight: 1.6 
        }}>
          {t('hero.subtitle')}
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {/* Используем компонент Button с asChild для интеграции с Link */}
          <Link to="/calculator" style={{ textDecoration: 'none' }}>
            <Button size="lg">
              {t('hero.calculate')}
            </Button>
          </Link>
          
          <Link to="/contact" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="lg">
              {t('hero.contact')}
            </Button>
          </Link>
        </div>
      </section>

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