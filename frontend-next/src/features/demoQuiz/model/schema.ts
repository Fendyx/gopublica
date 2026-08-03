// src/features/demoQuiz/model/schema.ts
import { z } from 'zod';

export const BUSINESS_TYPE_PRESETS = [
  'restaurant',
  'ecommerce',
  'beautySalon',
  'barbershop',
  'gym',
  'hotel',
  'auto',
  'other',
] as const;

export const GOAL_PRESETS = [
  'onlineSales',
  'onlinePresence',
  'bookings',
  'leadGen',
  'branding',
  'automation',
  'other',
] as const;

export const CONTACT_METHODS = ['phone', 'whatsapp', 'telegram'] as const;

export const BEST_TIME_OPTIONS = [
  'weekdayMorning',
  'weekdayAfternoon',
  'weekdayEvening',
  'weekend',
  'anytime',
] as const;

export const SUPPORTED_LANGUAGES = ['en', 'de', 'pl', 'ru', 'ua', 'es'] as const;

const telegramHandleRegex = /^@?[A-Za-z0-9_]{5,32}$/;

// ── Step 1: Business type ────────────────────────────────────────────
export const businessTypeSchema = z
  .object({
    preset: z.string().nullable(),
    custom: z.string().nullable(),
  })
  .refine(
    (v) => (v.preset && v.preset.trim()) || (v.custom && v.custom.trim()),
    { message: 'selectBusinessType' }
  );

// ── Step 2: Goals ────────────────────────────────────────────────────
export const goalsSchema = z
  .object({
    preset: z.array(z.string()),
    custom: z.string().nullable(),
  })
  .refine(
    (v) => (v.preset && v.preset.length > 0) || (v.custom && v.custom.trim()),
    { message: 'selectGoal' }
  );

// ── Step 3: Contact (per method) ─────────────────────────────────────
const baseContactFields = {
  name: z.string().min(2, 'name'),
  phone: z.string().optional().default(''),
  telegramHandle: z.string().optional().default(''),
  preferredLanguage: z.string().optional().default(''),
  bestTimeToCall: z.string().optional().default(''),
};

export const phoneFormSchema = z.object({
  ...baseContactFields,
  phone: z.string().min(3, 'phone'),
  preferredLanguage: z.string().min(2, 'language'),
  bestTimeToCall: z.string().min(2, 'bestTime'),
});

export const whatsappFormSchema = z.object({
  ...baseContactFields,
  phone: z.string().min(3, 'phone'),
});

export const telegramFormSchema = z.object({
  ...baseContactFields,
  telegramHandle: z
    .string()
    .min(5, 'handle')
    .regex(telegramHandleRegex, 'handle'),
});

export type PhoneFormValues = z.infer<typeof phoneFormSchema>;
export type WhatsAppFormValues = z.infer<typeof whatsappFormSchema>;
export type TelegramFormValues = z.infer<typeof telegramFormSchema>;

// ── Full payload schema (for the final submit) ───────────────────────
export const demoRequestPayloadSchema = z.object({
  businessType: businessTypeSchema,
  goals: goalsSchema,
  contactMethod: z.enum(CONTACT_METHODS),
  contact: z.object({
    name: z.string().min(2),
    phone: z.string(),
    telegramHandle: z.string(),
    preferredLanguage: z.string(),
    bestTimeToCall: z.string(),
  }),
  locale: z.string(),
  source: z.string(),
  consentAccepted: z.literal(true),
});
