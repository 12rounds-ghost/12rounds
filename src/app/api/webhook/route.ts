import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { trimiteEmailConfirmare } from '@/lib/email';

// Stripe.Address (citit de pe PaymentMethod) are campuri nullable; Stripe.AddressParam
// (folosit la Customer.update) le vrea undefined — de-a lungul webhook-ului convertim intre ele.
function laAdresaParam(a: Stripe.Address | null): Stripe.AddressParam | undefined {
  if (!a) return undefined;
  return {
    city: a.city ?? undefined,
    country: a.country ?? undefined,
    line1: a.line1 ?? undefined,
    line2: a.line2 ?? undefined,
    postal_code: a.postal_code ?? undefined,
    state: a.state ?? undefined,
  };
}

// Stripe are nevoie de body-ul brut pentru verificarea semnăturii
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Semnătură webhook invalidă', err);
    return NextResponse.json({ error: 'Semnătură invalidă' }, { status: 400 });
  }

  const sb = supabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const dedicatieId = session.metadata?.dedicatie_id;
      const email = session.customer_details?.email ?? session.customer_email ?? null;
      if (dedicatieId) {
        // .eq('status_plata', 'pending') face update-ul idempotent: Stripe poate
        // livra acelasi eveniment de mai multe ori, iar o retrimitere nu trebuie
        // sa poata resuscita o dedicatie deja platita, rambursata sau expirata.
        // .select() ne spune daca update-ul chiar s-a aplicat, ca sa trimitem
        // emailul o singura data, doar la tranzitia reala catre 'paid'.
        const { data: actualizate } = await sb
          .from('dedicatii')
          .update({
            status_plata: 'paid',
            email,
            stripe_payment_intent:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
          })
          .eq('id', dedicatieId)
          .eq('status_plata', 'pending')
          .select('id, tip, pentru')
          .maybeSingle();

        if (actualizate && email) {
          await trimiteEmailConfirmare({
            email,
            dedicatieId: actualizate.id,
            tip: actualizate.tip,
            pentru: actualizate.pentru,
          });
        }
      }
      break;
    }
    case 'payment_intent.succeeded': {
      // Sarcina E: fluxul rapid (Express Checkout Element / Payment Element).
      // Aceeasi idempotenta ca la checkout.session.completed — .eq('status_plata',
      // 'pending') garanteaza ca o retrimitere a evenimentului nu poate resuscita
      // o dedicatie deja platita, rambursata sau expirata.
      const pi = event.data.object as Stripe.PaymentIntent;
      const dedicatieId = pi.metadata?.dedicatie_id;
      if (!dedicatieId) break;

      // Sursa de adevar finala pentru datele de facturare e PaymentMethod-ul
      // folosit efectiv, nu ce am trimis noi la creare — wallet-ul poate
      // completa nume/adresa mai bine decat am primit din formular.
      let numeFacturare: string | null = null;
      let email: string | null = null;
      let adresaFacturare: Stripe.Address | null = null;
      if (typeof pi.payment_method === 'string') {
        try {
          const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
          numeFacturare = pm.billing_details.name;
          email = pm.billing_details.email;
          adresaFacturare = pm.billing_details.address;
        } catch (e) {
          console.error('Nu am putut citi PaymentMethod-ul pentru facturare', e);
        }
      }

      const facturaIncompleta = !numeFacturare || numeFacturare.trim().length < 3;

      const { data: actualizate } = await sb
        .from('dedicatii')
        .update({
          status_plata: 'paid',
          email,
          nume_facturare: numeFacturare,
          adresa_facturare: adresaFacturare,
          stripe_payment_intent: pi.id,
          // Regula de aur (Pasul 5): o problema de facturare nu blocheaza
          // niciodata fluxul dedicatiei — doar o semnalam pentru interventie manuala.
          ...(facturaIncompleta && {
            factura_status: 'manual',
            factura_eroare: 'Lipsește numele clientului',
          }),
        })
        .eq('id', dedicatieId)
        .eq('status_plata', 'pending')
        .select('id, tip, pentru, stripe_customer_id')
        .maybeSingle();

      if (actualizate) {
        // Actualizam si Customer-ul din Stripe, daca wallet-ul a returnat ceva
        // mai complet — SmartBill citeste de pe Customer, nu de pe PaymentMethod.
        if (actualizate.stripe_customer_id && (numeFacturare || email || adresaFacturare)) {
          try {
            await stripe.customers.update(actualizate.stripe_customer_id, {
              ...(numeFacturare && { name: numeFacturare }),
              ...(email && { email }),
              ...(adresaFacturare && { address: laAdresaParam(adresaFacturare) }),
            });
          } catch (e) {
            console.error('Nu am putut actualiza Customer-ul Stripe', e);
          }
        }

        if (email) {
          await trimiteEmailConfirmare({
            email,
            dedicatieId: actualizate.id,
            tip: actualizate.tip,
            pentru: actualizate.pentru,
          });
        }
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const dedicatieId = session.metadata?.dedicatie_id;
      if (dedicatieId) {
        await sb
          .from('dedicatii')
          .update({ status_plata: 'expired' })
          .eq('id', dedicatieId)
          .eq('status_plata', 'pending');
      }
      break;
    }
    default:
      console.log(`Eveniment Stripe neprocesat: ${event.type}`);
  }

  // Stripe trebuie sa primeasca 200 si pentru evenimente necunoscute/neprocesate,
  // altfel le retrimite la nesfarsit.
  return NextResponse.json({ received: true });
}
