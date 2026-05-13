import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, Mail } from 'lucide-react';
import './HeroSection.css';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero-section">
      <div className="hero-bg">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>
      
      <div className="hero-content">
        <h1 className="hero-title">{t('hero.title')}</h1>
        <p className="hero-subtitle">{t('hero.subtitle')}</p>
        <div className="hero-actions">
          <Link to="/calculator" className="hero-link">
            <Button size="lg" className="btn-hero-primary">
              <Calculator size={18} />
              {t('hero.calculate')}
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/contact" className="hero-link">
            <Button variant="outline" size="lg" className="btn-hero-outline">
              <Mail size={18} />
              {t('hero.contact')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}