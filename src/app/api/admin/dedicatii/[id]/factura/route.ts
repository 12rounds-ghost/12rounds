import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { obtineModeratorApi } from '@/lib/auth-admin';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

// Sarcina E, Pasul 5: cazurile "manual" / "eroare" au nevoie de interventie
// umana — admin-ul completeaza numele lipsa si semnaleaza ca poate fi
// reincercata emiterea (efectiva se intampla in integrarea Stripe<->SmartBill,
// declansata de actualizarea Customer-ului).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const mod = await obtineModeratorApi();
  if (!mod) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  if (mod.rol !== 'admin') return NextResponse.json({ error: 'Fără drepturi' }, { status: 403 });

  const { nume } = await req.json();
  if (typeof nume !== 'string' || nume.trim().length < 3) {
    return NextResponse.json({ error: 'Numele trebuie să aibă cel puțin 3 caractere.' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: ded } = await admin
    .from('dedicatii')
    .select('id, stripe_customer_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!ded) return NextResponse.json({ error: 'Dedicația nu a fost găsită.' }, { status: 404 });

  if (ded.stripe_customer_id) {
    try {
      await stripe.customers.update(ded.stripe_customer_id, { name: nume.trim() });
    } catch (e) {
      console.error('Nu am putut actualiza Customer-ul Stripe', e);
    }
  }

  await admin
    .from('dedicatii')
    .update({ nume_facturare: nume.trim(), factura_status: 'neemisa', factura_eroare: null })
    .eq('id', ded.id);

  return NextResponse.json({ ok: true });
}
