import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NUME_TIP } from '@/lib/types';
import { pregatesteDedicatie, type CorpDedicatie } from '@/lib/dedicatie-checkout';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

// Fluxul clasic Stripe Checkout (redirect). Ramane activ ca rezerva pentru
// browserele unde Express Checkout Element nu se incarca (Sarcina E, Pasul 7).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CorpDedicatie;
    const rezultat = await pregatesteDedicatie(req, body);
    if (rezultat.eroare) return rezultat.eroare;
    const { event, tarif, ded } = rezultat;

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

    // Numele e deja validat si salvat pe dedicatie in pregatesteDedicatie
    // (Sarcina V4-F) — il trecem si pe Customer, la fel ca la fluxul rapid.
    const customer = await stripe.customers.create({ name: ded.nume_facturare ?? undefined });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customer.id,
      // 'card' activează automat și Apple Pay / Google Pay în Stripe Checkout
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'ron',
            unit_amount: tarif.pret_bani,
            product_data: {
              name: `12 ROUNDS — ${NUME_TIP[ded.tip]}`,
              description: ded.pentru ? `Pentru: ${ded.pentru}` : event.nume,
            },
          },
        },
      ],
      metadata: { dedicatie_id: ded.id },
      success_url: `${origin}/status/${ded.id}?platit=1`,
      cancel_url: `${origin}/eveniment/${event.slug}?anulat=1${body.src ? `&src=${encodeURIComponent(body.src)}` : ''}`,
    });

    await supabaseAdmin()
      .from('dedicatii')
      .update({ stripe_session_id: session.id, stripe_customer_id: customer.id })
      .eq('id', ded.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('checkout error', e);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }
}
