import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DURATA_FARA_EVENIMENT_SECUNDE = 15;

// POST cu {slug, key} in body, NU GET /api/overlay/[slug]/next — acelasi
// motiv ca la /api/ecran/next: in productie, Route Handler-ele GET cu
// segment dinamic au ramas inghetate la primul raspuns calculat, in ciuda
// export const dynamic = 'force-dynamic'. Fara segment dinamic + POST s-a
// dovedit intotdeauna proaspat.
//
// Sarcina: overlay in doua formate (16:9 si 9:16), care trebuie sa arate
// ACEEASI dedicatie in ACELASI moment pe ambele pagini. Nu mai revendicam
// direct aici — apelam avanseaza_overlay_stream (0020_overlay_sincronizat.sql),
// care tine starea "ce ruleaza acum si pana cand" pe evenimentul insusi, ca
// oricate pagini sondeaza sa vada exact acelasi lucru, indiferent de ritmul
// propriu de sondare al fiecareia.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = body?.slug;
  const key = body?.key;

  const secret = process.env.OVERLAY_SECRET;
  if (!secret || key !== secret || typeof slug !== 'string' || !slug) {
    return NextResponse.json({ error: 'Acces refuzat.' }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: event } = await sb
    .from('events')
    .select('id, durata_stream_secunde')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ durata_secunde: DURATA_FARA_EVENIMENT_SECUNDE, dedicatie: null });
  }

  const durata = event.durata_stream_secunde || 12;
  const { data: rezultat } = await sb.rpc('avanseaza_overlay_stream', {
    p_event_id: event.id,
    p_durata_secunde: durata,
  });
  const ded = (rezultat as { id: string; mesaj: string | null; de_la: string | null; pentru: string | null }[] | null)?.[0] ?? null;

  return NextResponse.json({
    durata_secunde: durata,
    dedicatie: ded ? { id: ded.id, mesaj: ded.mesaj, de_la: ded.de_la, pentru: ded.pentru } : null,
  });
}
