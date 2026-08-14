import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  // Fara asta, SDK-ul nu reincearca deloc — un rate-limit temporar Stripe
  // (probabil sub valuri de plati simultane la show) ajungea direct eroare
  // 500 la client. SDK-ul reincearca automat doar erorile potrivite pentru
  // asta (rate-limit, retea, 5xx Stripe), cu idempotency key generat automat,
  // deci nu risca dublarea platii (gasit prin testul de incarcare local).
  maxNetworkRetries: 2,
});
