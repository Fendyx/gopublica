// src/entities/demoRequest/model/types.ts

export type ContactMethod = 'phone' | 'whatsapp' | 'telegram';

export type DemoStatus = 'New' | 'Contacted' | 'Converted' | 'Rejected';

export interface BusinessTypeValue {
  preset: string | null;
  custom: string | null;
}

export interface GoalsValue {
  preset: string[];
  custom: string | null;
}

export interface ContactValue {
  name: string;
  phone: string;
  telegramHandle: string;
  preferredLanguage: string;
  bestTimeToCall: string;
}

/** Full payload sent to POST /api/public/demo-requests */
export interface DemoRequestPayload {
  businessType: BusinessTypeValue;
  goals: GoalsValue;
  contactMethod: ContactMethod;
  contact: ContactValue;
  locale: string;
  source: string;
  consentAccepted: boolean;
}

/** Response returned by the backend on success */
export interface DemoRequestResponse {
  _id: string;
  status: DemoStatus;
  createdAt: string;
}
