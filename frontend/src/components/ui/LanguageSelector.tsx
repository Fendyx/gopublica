// frontend/src/components/ui/LanguageSelector.jsx
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (e: { target: { value: string | undefined; }; }) => {
    i18n.changeLanguage(e.target.value);
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ua', label: 'Українська' },
    { code: 'ru', label: 'Русский' },
    { code: 'de', label: 'German' },
    { code: 'es', label: 'Español' },
  ];

  const current = languages.find(l => l.code === i18n.resolvedLanguage) || languages[0];

  return (
    <div className="language-selector-wrapper">
      <Globe size={14} className="language-icon" />
      <select
        className="language-selector"
        value={i18n.resolvedLanguage || 'ua'}
        onChange={changeLanguage}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="selector-chevron" />
    </div>
  );
}