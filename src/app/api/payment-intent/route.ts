import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NUME_TIP } from '@/lib/types';
import { pregatesteDedicatie, type CorpDedicatie } from '@/lib/dedicatie-checkout';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

interface DateFacturareBody {
  name?: string;
  email?: string;
  address?: Stripe.AddressParam;
}

interface CorpPaymentIntent extends CorpDedicatie {
  billingDetails?: DateFacturareBody;
}

// Fluxul rapid (Sarcina E): Express Checkout Element / Payment Element,
// montate direct pe 12rounds.ro. Inlocuieste /api/checkout ca flux principal,
// dar acela ramane activ ca rezerva (Pasul 7 din SARCINA-E-PLATI-SI-FACTURARE.md).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CorpPaymentIntent;
    const rezultat = await pregatesteDedicatie(req, {
      ...body,
      nume_facturare: body.billingDetails?.name,
    });
    if (rezultat.eroare) return rezultat.eroare;
    const { event, tarif, ded } = rezultat;

    const billingDetails = body.billingDetails ?? {};

    // Customer, nu doar billing_details pe PaymentMethod: SmartBill (si
    // majoritatea integrarilor de facturare) citesc datele de pe Customer.
    const customer = await stripe.customers.create({
      name: billingDetails.name,
      email: billingDetails.email ?? undefined,
      address: billingDetails.address,
    });

    const pi = await stripe.paymentIntents.create({
      amount: tarif.pret_bani,
      currency: 'ron',
      customer: customer.id,
      metadata: { dedicatie_id: ded.id, event_id: event.id },
      automatic_payment_methods: { enabled: true },
      description: `12 ROUNDS — ${NUME_TIP[ded.tip]} — ${event.nume}`,
    });

    await supabaseAdmin()
      .from('dedicatii')
      .update({ stripe_customer_id: customer.id, stripe_payment_intent: pi.id })
      .eq('id', ded.id);

    return NextResponse.json({ clientSecret: pi.client_secret, dedicatie_id: ded.id });
  } catch (e) {
    console.error('payment-intent error', e);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }
}
