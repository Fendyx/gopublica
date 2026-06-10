'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SubscribeForm from '@/features/billing/ui/SubscribeForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

export default function SubscribePageClient() {
  return (
    <Elements stripe={stripePromise}>
      <SubscribeForm />
    </Elements>
  );
}