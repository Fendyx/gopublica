import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import './ContactPage.css';

export default function ContactPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь в будущем будет логика отправки в CRM (leadsApi)
    setSent(true);
  };

  return (
    <div className="contact-page">
      <h1 className="contact-title">{t('contact.title')}</h1>
      <p className="contact-subtitle">
        {t('contact.subtitle')}
      </p>

      {sent ? (
        <div className="contact-success">
          <div className="success-icon">✓</div>
          <h3 className="success-title">{t('contact.successTitle')}</h3>
          <p className="success-desc">
            {t('contact.successDesc')}
          </p>
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">{t('contact.form.name')}</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder={t('contact.form.namePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('contact.form.phone')}</label>
            <input
              type="tel"
              className="form-input"
              required
              placeholder={t('contact.form.phonePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('contact.form.email')}</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder={t('contact.form.emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('contact.form.message')}</label>
            <textarea
              className="form-textarea"
              placeholder={t('contact.form.messagePlaceholder')}
            />
          </div>

          {/* Используем наш кастомный Button */}
          <Button size="lg" type="submit" style={{ width: '100%', marginTop: '8px' }}>
            {t('contact.form.submit')}
          </Button>
        </form>
      )}
    </div>
  );
}