import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import ua from './ua.json';
import ru from './ru.json';
import de from './de.json';
import es from './es.json';

const resources = {
  en: { translation: en },
  ua: { translation: ua },
  ru: { translation: ru },
  de: { translation: de },
  es: { translation: es }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ua',
    supportedLngs: ['en', 'ua', 'ru', 'de', 'es'],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;