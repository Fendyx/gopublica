// src/features/demoQuiz/model/demoQuizStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BusinessTypeValue,
  GoalsValue,
  ContactValue,
  ContactMethod,
  DemoRequestPayload,
} from '@/entities/demoRequest/model/types';
import { submitDemoRequest } from '@/entities/demoRequest/api/demoRequestsApi';

export type QuizStep = 1 | 2 | 3;
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

interface DemoQuizState {
  // ── Funnel state ──────────────────────────────────────────────────
  step: QuizStep;
  businessType: BusinessTypeValue;
  goals: GoalsValue;
  contactMethod: ContactMethod | null;
  contact: ContactValue;
  consentAccepted: boolean;

  // ── Submission state ──────────────────────────────────────────────
  status: SubmitStatus;
  error: string | null;
  createdId: string | null;

  // ── Actions ───────────────────────────────────────────────────────
  setStep: (step: QuizStep) => void;
  next: () => void;
  back: () => void;

  setBusinessTypePreset: (preset: string | null) => void;
  setBusinessTypeCustom: (custom: string) => void;

  toggleGoal: (goal: string) => void;
  setCustomGoal: (custom: string) => void;

  setContactMethod: (method: ContactMethod) => void;
  updateContact: (patch: Partial<ContactValue>) => void;
  setConsent: (accepted: boolean) => void;

  submit: (locale: string) => Promise<void>;
  reset: () => void;
}

const initialContact: ContactValue = {
  name: '',
  phone: '',
  telegramHandle: '',
  preferredLanguage: '',
  bestTimeToCall: '',
};

const initialState = {
  step: 1 as QuizStep,
  businessType: { preset: null, custom: null } as BusinessTypeValue,
  goals: { preset: [], custom: null } as GoalsValue,
  contactMethod: null as ContactMethod | null,
  contact: { ...initialContact } as ContactValue,
  consentAccepted: false,
  status: 'idle' as SubmitStatus,
  error: null as string | null,
  createdId: null as string | null,
};

export const useDemoQuizStore = create<DemoQuizState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),
      next: () => set((s) => ({ step: Math.min(3, s.step + 1) as QuizStep })),
      back: () => set((s) => ({ step: Math.max(1, s.step - 1) as QuizStep })),

      setBusinessTypePreset: (preset) =>
        set((s) => ({
          businessType: { preset, custom: preset ? null : s.businessType.custom },
        })),
      setBusinessTypeCustom: (custom) =>
        set((s) => ({
          businessType: {
            preset: custom.trim() ? null : s.businessType.preset,
            custom,
          },
        })),

      toggleGoal: (goal) =>
        set((s) => {
          const exists = s.goals.preset.includes(goal);
          const preset = exists
            ? s.goals.preset.filter((g) => g !== goal)
            : [...s.goals.preset, goal];
          return { goals: { preset, custom: s.goals.custom } };
        }),
      setCustomGoal: (custom) =>
        set((s) => ({
          goals: {
            preset: custom.trim() ? [] : s.goals.preset,
            custom,
          },
        })),

      setContactMethod: (method) =>
        set({ contactMethod: method, error: null }),

      updateContact: (patch) =>
        set((s) => ({ contact: { ...s.contact, ...patch } })),

      setConsent: (accepted) => set({ consentAccepted: accepted }),

      submit: async (locale) => {
        const state = get();
        if (state.status === 'submitting') return;

        set({ status: 'submitting', error: null });

        const payload: DemoRequestPayload = {
          businessType: state.businessType,
          goals: state.goals,
          contactMethod: state.contactMethod!,
          contact: state.contact,
          locale,
          source: 'website-demo-funnel',
          consentAccepted: state.consentAccepted,
        };

        try {
          const res = await submitDemoRequest(payload);
          set({
            status: 'success',
            createdId: res._id,
            error: null,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'generic';
          set({
            status: 'error',
            error: message === 'RATE_LIMITED' ? 'rateLimited' : 'generic',
          });
        }
      },

      reset: () => set({ ...initialState, contact: { ...initialContact } }),
    }),
    {
      name: 'gopublica-demo-quiz',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.sessionStorage : (undefined as any)
      ),
      // Only persist the funnel progress, not transient submit status.
      partialize: (state) => ({
        step: state.step,
        businessType: state.businessType,
        goals: state.goals,
        contactMethod: state.contactMethod,
        contact: state.contact,
        consentAccepted: state.consentAccepted,
      }),
    }
  )
);
