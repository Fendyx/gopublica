// src/widgets/DemoQuiz/forms/WhatsAppForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { whatsappFormSchema } from '@/features/demoQuiz/model/schema';
import { useDemoQuizStore } from '@/features/demoQuiz/model/demoQuizStore';
import { cn } from '@/shared/lib/utils';

export default function WhatsAppForm() {
  const t = useTranslations('demoQuiz');
  const { contact, updateContact } = useDemoQuizStore();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(whatsappFormSchema) as any,
    defaultValues: {
      name: contact.name,
      phone: contact.phone,
    },
    mode: 'onTouched',
  });

  // Sync local form state → Zustand store cleanly (no per-keystroke re-renders).
  useEffect(() => {
    const subscription = watch((value) => {
      updateContact(value as any);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateContact]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onSubmit={(e) => e.preventDefault()}
      className="space-y-4"
    >
      <h3 className="text-lg font-bold">{t('step3.forms.whatsapp.title')}</h3>

      <Field label={t('step3.forms.whatsapp.name')} error={errors.name && t('errors.generic')}>
        <input
          {...register('name')}
          type="text"
          placeholder={t('step3.forms.whatsapp.namePlaceholder')}
          className={inputClass(!!errors.name)}
        />
      </Field>

      <Field label={t('step3.forms.whatsapp.phone')} error={errors.phone && t('errors.generic')}>
        <input
          {...register('phone')}
          type="tel"
          inputMode="tel"
          placeholder={t('step3.forms.whatsapp.phonePlaceholder')}
          className={inputClass(!!errors.phone)}
        />
      </Field>
    </motion.form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[var(--text-muted)]">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-xl border-2 bg-[var(--surface)] px-4 py-3.5 text-base focus:outline-none transition-colors',
    hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-[var(--border)] focus:border-[var(--primary-color)]'
  );
}
