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
}

export function PlataElements({
  sumaBani,
  dateDedicatie,
  eventSlug,
  onEsuatEncarcare,
}: {
  sumaBani: number;
  dateDedicatie: DateDedicatie;
  eventSlug: string;
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
  onEsuatEncarcare,
}: {
  sumaBani: number;
  dateDedicatie: DateDedicatie;
  eventSlug: string;
  email: string;
  onEmailChange: (v: string) => void;
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
          // propriul camp de email deasupra) — Stripe cere explicit aceasta
          // valoare aici, altfel arunca eroare la confirmare.
          payment_method_data: { billing_details: { email: emailFinal } },
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
    const detalii = event.billingDetails;
    await creeazaPaymentIntentSiConfirma({
      name: detalii?.name,
      email: detalii?.email,
      address: detalii?.address as Record<string, unknown> | undefined,
    });
  }

  async function onSubmitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!elements) return;
    // Numele e citit de Stripe direct din campul billingDetails.name al
    // Payment Element-ului (fields.billingDetails.name: 'auto' mai jos).
    await creeazaPaymentIntentSiConfirma({ email });
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
            fields: { billingDetails: { name: 'auto', email: 'never' } },
          }}
          onLoadError={onEsuatEncarcare}
        />
        <button className="btn" disabled={loading || !stripe} style={{ marginTop: 14 }}>
          {loading ? 'Se procesează…' : 'Plătește'}
        </button>
        {eroare && <p className="eroare">{eroare}</p>}
      </form>
    </div>
  );
}
