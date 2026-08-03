// src/widgets/DemoQuiz/DemoQuizWidget.tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useDemoQuizStore } from '@/features/demoQuiz/model/demoQuizStore';
import {
  businessTypeSchema,
  goalsSchema,
} from '@/features/demoQuiz/model/schema';
import { cn } from '@/shared/lib/utils';
import StepIndicator from './StepIndicator';
import Step1BusinessType from './steps/Step1BusinessType';
import Step2Goals from './steps/Step2Goals';
import Step3Contact from './steps/Step3Contact';

export default function DemoQuizWidget() {
  const t = useTranslations('demoQuiz');
  const locale = useLocale();
  const {
    step,
    next,
    back,
    businessType,
    goals,
    contactMethod,
    consentAccepted,
    status,
    error,
    submit,
    reset,
  } = useDemoQuizStore();

  const [stepError, setStepError] = useState<string | null>(null);

  // ── Step validation before advancing ────────────────────────────────
  const validateCurrentStep = (): boolean => {
    setStepError(null);
    if (step === 1) {
      const r = businessTypeSchema.safeParse(businessType);
      if (!r.success) {
        setStepError('selectBusinessType');
        return false;
      }
    }
    if (step === 2) {
      const r = goalsSchema.safeParse(goals);
      if (!r.success) {
        setStepError('selectGoal');
        return false;
      }
    }
    if (step === 3) {
      if (!contactMethod) {
        setStepError('selectContactMethod');
        return false;
      }
      if (!consentAccepted) {
        setStepError('acceptConsent');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) next();
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    await submit(locale);
  };

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] px-6 py-16 sm:py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,color-mix(in_srgb,var(--primary-color)_8%,transparent),transparent_70%)] pointer-events-none" />
        <span className="relative inline-block text-xs font-bold uppercase tracking-[0.1em] text-[var(--primary-color)]">
          {t('hero.eyebrow')}
        </span>
        <h1 className="relative mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          {t('hero.title')}
        </h1>
        <p className="relative mt-3 max-w-lg mx-auto text-base sm:text-lg text-[var(--text-muted)]">
          {t('hero.subtitle')}
        </p>
      </section>

      {/* Main card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
          {isSuccess ? (
            <SuccessScreen onRestart={reset} t={t} />
          ) : (
            <>
              <StepIndicator current={step} />

              <div className="mt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {step === 1 && <Step1BusinessType />}
                    {step === 2 && <Step2Goals />}
                    {step === 3 && <Step3Contact />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step error */}
              {stepError && (
                <p className="mt-4 text-sm text-red-500 text-center">
                  {t(`errors.${stepError}`)}
                </p>
              )}

              {/* Submit error */}
              {error && (
                <p className="mt-4 text-sm text-red-500 text-center">
                  {t(`errors.${error}`)}
                </p>
              )}

              {/* Navigation buttons */}
              <div className="mt-8 flex items-center gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={back}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('buttons.back')}
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                  >
                    {t('buttons.next')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      'inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-6 py-3.5 text-sm font-bold text-white transition-opacity',
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('buttons.submitting')}
                      </>
                    ) : (
                      t('buttons.submit')
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({
  onRestart,
  t,
}: {
  onRestart: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-10 text-center space-y-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
      >
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </motion.div>
      <h2 className="text-2xl font-bold">{t('success.title')}</h2>
      <p className="max-w-sm text-sm text-[var(--text-muted)]">
        {t('success.text')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--primary-color)] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          {t('success.cta')}
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--muted)] transition-colors"
        >
          {t('buttons.restart')}
        </button>
      </div>
    </motion.div>
  );
}
