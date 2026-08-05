'use client';
import { useState } from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeElementsOptions,
} from '@stripe/stripe-js';
import { stripeClientPromise, APARENTA_STRIPE } from '@/lib/stripe-client';
import { salveazaDedicatieLocala } from '@/lib/dedicatii-locale';

interface DateDedicatie {
  tip: string;
  de_la: string;
  pentru: string;
  artist_preferat: string;
  mesaj: string;
  src: string;
  event_id: string;
  poza_path: string | null;
  poza_latime: number | null;
  poza_inaltime: number | null;
}

export function PlataElements({
  sumaBani,
  dateDedicatie,
  eventSlug,
  numeComplet,
  onNumeCompletChange,
  numeValid,
  onEsuatEncarcare,
}: {
  sumaBani: number;
  dateDedicatie: DateDedicatie;
  eventSlug: string;
  numeComplet: string;
  onNumeCompletChange: (v: string) => void;
  numeValid: boolean;
  onEsuatEncarcare: () => void;
}) {
  const [email, setEmail] = useState('');

  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: sumaBani,
    currency: 'ron',
    appearance: APARENTA_STRIPE,
  };

  return (
    <Elements stripe={stripeClientPromise()} options={options}>
      <FormularPlata
        sumaBani={sumaBani}
        dateDedicatie={dateDedicatie}
        eventSlug={eventSlug}
        email={email}
        onEmailChange={setEmail}
        numeComplet={numeComplet}
        onNumeCompletChange={onNumeCompletChange}
        numeValid={numeValid}
        onEsuatEncarcare={onEsuatEncarcare}
      />
    </Elements>
  );
}

function FormularPlata({
  dateDedicatie,
  eventSlug,
  email,
  onEmailChange,
  numeComplet,
  onNumeCompletChange,
  numeValid,
  onEsuatEncarcare,
}: {
  sumaBani: number;
  dateDedicatie: DateDedicatie;
  eventSlug: string;
  email: string;
  onEmailChange: (v: string) => void;
  numeComplet: string;
  onNumeCompletChange: (v: string) => void;
  numeValid: boolean;
  onEsuatEncarcare: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState('');

  async function creeazaPaymentIntentSiConfirma(billingDetails: {
    name?: string;
    email?: string;
    address?: Record<string, unknown>;
  }) {
    if (!stripe || !elements) return;
    setLoading(true);
    setEroare('');
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setEroare(submitError.message ?? 'Datele de plată sunt incomplete.');
        setLoading(false);
        return;
      }

      const emailFinal = billingDetails.email || email || '';
      const numeFinal = billingDetails.name || numeComplet;

      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dateDedicatie,
          billingDetails: {
            name: billingDetails.name,
            email: emailFinal || undefined,
            address: billingDetails.address,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la plată.');

      salveazaDedicatieLocala({ id: data.dedicatie_id, event_slug: eventSlug });

      const origin = window.location.origin;
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${origin}/status/${data.dedicatie_id}`,
          // Payment Element are fields.billingDetails.email = 'never' (avem
          // propriul camp de email deasupra) si name = 'never' (Sarcina V4-F,
          // avem propriul camp de nume) — Stripe cere explicit ambele valori
          // aici, altfel arunca eroare la confirmare.
          payment_method_data: { billing_details: { email: emailFinal, name: numeFinal } },
        },
      });
      if (confirmError) {
        setEroare(confirmError.message ?? 'Plata nu a putut fi confirmată.');
        setLoading(false);
      }
      // succes -> Stripe redirectioneaza singur catre return_url
    } catch (e) {
      const eCazutConexiune = e instanceof TypeError;
      setEroare(
        eCazutConexiune
          ? 'Conexiunea a picat. Verifică semnalul și încearcă din nou.'
          : e instanceof Error
            ? e.message
            : 'A apărut o eroare.'
      );
      setLoading(false);
    }
  }

  async function onConfirmExpressCheckout(event: StripeExpressCheckoutElementConfirmEvent) {
    // Sarcina V4-F: portofelul (Apple Pay / Google Pay) intoarce numele
    // singur — il folosim direct, fara sa cerem clientului sa il tasteze, si
    // actualizam si campul vizibil din formular (ramane editabil ulterior).
    const detalii = event.billingDetails;
    if (detalii?.name) onNumeCompletChange(detalii.name);
    await creeazaPaymentIntentSiConfirma({
      name: detalii?.name || numeComplet,
      email: detalii?.email,
      address: detalii?.address as Record<string, unknown> | undefined,
    });
  }

  async function onSubmitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!elements || !numeValid) return;
    // Numele vine acum din campul nostru propriu (Sarcina V4-F) — Payment
    // Element are fields.billingDetails.name: 'never' mai jos, ca sa nu
    // afiseze un al doilea camp de nume, redundant.
    await creeazaPaymentIntentSiConfirma({ email, name: numeComplet });
  }

  return (
    <div className="plata-elements">
      <div className="camp-email">
        <label htmlFor="email-plata">Email (opțional)</label>
        <input
          id="email-plata"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="tu@exemplu.ro"
        />
        <p className="sub" style={{ textAlign: 'left', margin: '4px 0 0' }}>
          Îți trimitem linkul dedicației și factura.
        </p>
      </div>

      <ExpressCheckoutElement
        options={{
          emailRequired: false,
          billingAddressRequired: true,
          phoneNumberRequired: false,
          paymentMethods: { applePay: 'auto', googlePay: 'auto', link: 'never' },
        }}
        onConfirm={onConfirmExpressCheckout}
        onLoadError={onEsuatEncarcare}
      />

      <div className="separator-plata">sau plătește cu cardul</div>

      <form onSubmit={onSubmitCard}>
        <PaymentElement
          options={{
            fields: { billingDetails: { name: 'never', email: 'never' } },
          }}
          onLoadError={onEsuatEncarcare}
        />
        <button className="btn" disabled={loading || !stripe || !numeValid} style={{ marginTop: 14 }}>
          {loading ? 'Se procesează…' : 'Plătește'}
        </button>
        {!numeValid && <p className="sub" style={{ margin: '6px 0 0' }}>Completează numele complet mai sus.</p>}
        {eroare && <p className="eroare">{eroare}</p>}
      </form>
    </div>
  );
}
