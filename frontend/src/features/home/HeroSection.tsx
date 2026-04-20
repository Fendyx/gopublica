import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import './HeroSection.css';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero-section">
      <h1 className="hero-title">
        {t('hero.title')}
      </h1>
      
      <p className="hero-subtitle">
        {t('hero.subtitle')}
      </p>
      
      <div className="hero-actions">
        <Link to="/calculator" className="hero-link">
          <Button size="lg">
            {t('hero.calculate')}
          </Button>
        </Link>
        
        <Link to="/contact" className="hero-link">
          <Button variant="outline" size="lg">
            {t('hero.contact')}
          </Button>
        </Link>
      </div>
    </section>
  );
}