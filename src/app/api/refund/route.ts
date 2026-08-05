import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { obtineModeratorApi } from '@/lib/auth-admin';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

// Refund inițiat din panoul de moderare. Doar rolul 'admin' — moderatorii pot
// aproba/respinge, dar rambursarea (bani reali) rămâne exclusiv admin
// (Sarcina D, IMPLEMENTARE-V2.md: "moderator | ... (fără refund, fără sume)").
export async function POST(req: Request) {
  const mod = await obtineModeratorApi();
  if (!mod) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  if (mod.rol !== 'admin') return NextResponse.json({ error: 'Fără drepturi' }, { status: 403 });

  const admin = supabaseAdmin();

  const { dedicatie_id } = await req.json();
  const { data: ded } = await admin
    .from('dedicatii')
    .select('id, status_plata, stripe_payment_intent, factura_status')
    .eq('id', dedicatie_id)
    .maybeSingle();

  if (!ded || ded.status_plata !== 'paid' || !ded.stripe_payment_intent) {
    return NextResponse.json({ error: 'Dedicația nu poate fi rambursată.' }, { status: 400 });
  }

  await stripe.refunds.create({ payment_intent: ded.stripe_payment_intent });

  // Sarcina E, Pasul 5: o factura deja emisa trebuie stornata manual daca
  // integrarea SmartBill nu o face automat — marcam pentru interventie si o
  // scoatem in filtrul "Facturi cu probleme" din /admin/dedicatii.
  await admin
    .from('dedicatii')
    .update({
      status_plata: 'refunded',
      ...(ded.factura_status === 'emisa' && {
        factura_status: 'manual',
        factura_eroare: 'necesită stornare',
      }),
    })
    .eq('id', ded.id);

  return NextResponse.json({ ok: true });
}
