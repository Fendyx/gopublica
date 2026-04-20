import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select
      className="language-selector"
      value={i18n.resolvedLanguage || 'ua'}
      onChange={changeLanguage}
    >
      <option value="en">EN</option>
      <option value="ua">UA</option>
      <option value="ru">RU</option>
      <option value="de">DE</option>
      <option value="es">ES</option>
    </select>
  );
}