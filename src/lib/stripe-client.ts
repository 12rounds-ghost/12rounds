import { loadStripe, type Stripe } from '@stripe/stripe-js';
import type { Appearance } from '@stripe/stripe-js';

let promisiune: Promise<Stripe | null> | null = null;

export function stripeClientPromise() {
  if (!promisiune) {
    promisiune = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
  }
  return promisiune;
}

// Tema Elements, aliniata cu paleta rosu/negru a site-ului (Sarcina E).
export const APARENTA_STRIPE: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#e21d1d',
    colorBackground: '#141416',
    colorText: '#f5f5f5',
    colorTextSecondary: '#9a9aa2',
    colorDanger: '#e21d1d',
    fontFamily: 'Barlow, Arial, sans-serif',
    borderRadius: '10px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #2a2a2e', backgroundColor: '#1c1c1f' },
    '.Input:focus': { border: '1px solid #e21d1d' },
    '.Tab': { border: '1px solid #2a2a2e', backgroundColor: '#1c1c1f' },
    '.Tab--selected': { border: '1px solid #e21d1d' },
  },
};
