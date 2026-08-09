// src/widgets/DemoQuiz/steps/Step3Contact.tsx
'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, MessageCircle, Send, type LucideProps } from 'lucide-react';
import Link from 'next/link';
import { useDemoQuizStore } from '@/features/demoQuiz/model/demoQuizStore';
import { CONTACT_METHODS } from '@/features/demoQuiz/model/schema';
import type { ContactMethod } from '@/entities/demoRequest/model/types';
import { cn } from '@/shared/lib/utils';
import PhoneForm from '../forms/PhoneForm';
import WhatsAppForm from '../forms/WhatsAppForm';
import TelegramForm from '../forms/TelegramForm';

const METHOD_ICONS: Record<ContactMethod, React.ComponentType<LucideProps>> = {
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
};

const METHOD_COLORS: Record<ContactMethod, string> = {
  phone: '#2563eb',
  whatsapp: '#25D366',
  telegram: '#2AABEE',
};

export default function Step3Contact() {
  const t = useTranslations('demoQuiz');
  const { contactMethod, setContactMethod, consentAccepted, setConsent } =
    useDemoQuizStore();

  return (
    <div className="space-y-6">
      <header className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('step3.title')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto">
          {t('step3.subtitle')}
        </p>
      </header>

      {/* Contact method selector */}
      <div className="grid grid-cols-3 gap-3">
        {CONTACT_METHODS.map((method, idx) => {
          const Icon = METHOD_ICONS[method];
          const color = METHOD_COLORS[method];
          const isSelected = contactMethod === method;
          return (
            <motion.button
              key={method}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              onClick={() => setContactMethod(method)}
              style={{ '--m-color': color } as React.CSSProperties}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all',
                'min-h-[88px]',
                isSelected
                  ? 'border-[var(--m-color)] bg-[color-mix(in_srgb,var(--m-color)_8%,transparent)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--m-color)]/50 hover:-translate-y-0.5'
              )}
            >
              <Icon
                className="h-6 w-6"
                style={{ color: isSelected ? color : 'var(--text-muted)' }}
              />
              <span
                className="text-xs sm:text-sm font-semibold text-center leading-tight"
                style={{ color: isSelected ? color : 'var(--text)' }}
              >
                {t(`step3.methods.${method}`)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Animated sub-form swap (slide up) */}
      <AnimatePresence mode="wait">
        {contactMethod === 'phone' && <PhoneForm key="phone" />}
        {contactMethod === 'whatsapp' && <WhatsAppForm key="whatsapp" />}
        {contactMethod === 'telegram' && <TelegramForm key="telegram" />}
      </AnimatePresence>

      {/* Consent checkbox */}
      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] shrink-0"
        />
        <span className="text-sm text-[var(--text-muted)] leading-relaxed">
          {t.rich('step3.consent', {
            terms: (chunks) => (
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-[var(--primary-color)] underline hover:opacity-80"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-[var(--primary-color)] underline hover:opacity-80"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
    </div>
  );
}
