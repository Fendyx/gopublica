const mongoose = require('mongoose');

// Вспомогательная схема для мультиязычных текстовых полей
const i18nSchema = {
  type: Map,
  of: String,
  default: {}
};

const jobFormSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fields: {
    type: [{
      id: { type: String, required: true },       // уникальный ключ
      label: { type: String, required: true },    // метка поля на базовом языке (English)
      labelI18n: i18nSchema,                      // переводы метки: { "pl": "...", "de": "..." }
      type: {
        type: String,
        enum: ['text', 'email', 'tel', 'textarea', 'select', 'file', 'checkbox', 'radio'],
        required: true,
      },
      required: { type: Boolean, default: false },
      options: [String],                          // варианты для select/radio на английском
      optionsI18n: {                              // переводы вариантов
        type: Map,
        of: [String],
        default: {}
      },
      placeholder: { type: String, default: '' },
      placeholderI18n: i18nSchema,
      validation: {
        pattern: { type: String, default: '' },
        minLength: { type: Number, default: 0 },
        maxLength: { type: Number, default: 0 },
      },
      order: { type: Number, default: 0 },
    }],
    default: [
      {
        id: 'fullName',
        label: 'Full Name',
        labelI18n: { pl: 'Imię i nazwisko', de: 'Vollständiger Name' },
        type: 'text',
        required: true,
        placeholder: 'John Doe',
        placeholderI18n: { pl: 'Jan Kowalski', de: 'Max Mustermann' },
        order: 0,
      },
      {
        id: 'email',
        label: 'Email',
        labelI18n: { pl: 'Email', de: 'E-Mail' },
        type: 'email',
        required: true,
        placeholder: 'john@example.com',
        placeholderI18n: { pl: 'jan@example.com', de: 'max@example.com' },
        order: 1,
      },
      {
        id: 'phone',
        label: 'Phone number',
        labelI18n: { pl: 'Numer telefonu', de: 'Telefonnummer' },
        type: 'tel',
        required: true,
        placeholder: '+1 555 123-4567',
        placeholderI18n: { pl: '+48 792 123-456', de: '+49 170 1234567' },
        order: 2,
      },
      {
        id: 'position',
        label: 'Desired position',
        labelI18n: { pl: 'Pożądane stanowisko', de: 'Angestrebte Position' },
        type: 'text',
        required: false,
        placeholder: 'Chef Cook',
        placeholderI18n: { pl: 'Szef kuchni', de: 'Küchenchef' },
        order: 3,
      },
      {
        id: 'coverLetter',
        label: 'Cover letter',
        labelI18n: { pl: 'List motywacyjny', de: 'Anschreiben' },
        type: 'textarea',
        required: false,
        placeholder: 'Tell us about yourself...',
        placeholderI18n: { pl: 'Opowiedz o sobie...', de: 'Erzählen Sie uns von sich...' },
        order: 4,
      },
      {
        id: 'resume',
        label: 'Resume (PDF, DOC)',
        labelI18n: { pl: 'CV (PDF, DOC)', de: 'Lebenslauf (PDF, DOC)' },
        type: 'file',
        required: true,
        order: 5,
      },
    ],
  },
  title: { 
    type: String, 
    default: 'Join our team' 
  },
  titleI18n: {
    type: Map,
    of: String,
    default: { 
      pl: 'Dołącz do нашего zespołu', 
      de: 'Werden Sie Teil unseres Teams'
    }
  },
  
  description: { 
    type: String, 
    default: 'Please fill out the form below and we will get back to you shortly.' 
  },
  descriptionI18n: {
    type: Map,
    of: String,
    default: {
      pl: 'Wypełnij poniższy formularz, a wkrótce się z Tobą skontaktujemy.',
      de: 'Bitte füllen Sie das untenstehende Formular aus und wir werden uns in Kürze bei Ihnen melden.'
    }
  },
  
  submitButtonText: { 
    type: String, 
    default: 'Submit Application' 
  },
  submitButtonTextI18n: {
    type: Map,
    of: String,
    default: { 
      pl: 'Wyślij aplikację', 
      de: 'Bewerbung absenden'
    }
  },
  
  successMessage: { 
    type: String, 
    default: 'Thank you! Your application has been submitted successfully.' 
  },
  successMessageI18n: {
    type: Map,
    of: String,
    default: {
      pl: 'Dziękujemy! Twoja aplikacja została pomyślnie wysłana.',
      de: 'Danke! Ihre Bewerbung wurde erfolgreich übermittelt.'
    }
  },
  
  notificationEmail: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('JobFormSettings', jobFormSettingsSchema);