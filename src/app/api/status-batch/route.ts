import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

// Sarcina V4-B (IMPLEMENTARE-V4.md): un singur apel pentru toata lista din
// /dedicatiile-mele, in loc de un fetch per dedicatie. Aceleasi campuri
// publice ca /api/status/[id] — niciodata stripe_* sau suma_bani.
const CAMPURI_PUBLICE =
  'id, tip, pentru, de_la, status_plata, status_moderare, status_difuzare, motiv_respingere, event_id, sursa_platforma';
const LIMITA_ID_URI = 20;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corp de cerere invalid.' }, { status: 400 });
  }

  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'Lista de id-uri este invalidă.' }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('dedicatii')
    .select(CAMPURI_PUBLICE)
    .in('id', (ids as string[]).slice(0, LIMITA_ID_URI));

  if (error) {
    console.error('status-batch api error', error);
    return NextResponse.json({ error: 'A apărut o eroare.' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
