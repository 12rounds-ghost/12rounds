import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Dedicatie } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DURATA_FARA_EVENIMENT_SECUNDE = 15;

// POST cu {slug, key} in body, NU GET /api/overlay/[slug]/next — acelasi
// motiv ca la /api/ecran/next: in productie, Route Handler-ele GET cu
// segment dinamic au ramas inghetate la primul raspuns calculat, in ciuda
// export const dynamic = 'force-dynamic'. Fara segment dinamic + POST s-a
// dovedit intotdeauna proaspat.
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

  const { data: revendicate } = await sb.rpc('revendica_dedicatie_stream', { p_event_id: event.id });
  const ded = (revendicate as Dedicatie[] | null)?.[0] ?? null;

  return NextResponse.json({
    durata_secunde: event.durata_stream_secunde || 12,
    dedicatie: ded
      ? { mesaj: ded.mesaj, de_la: ded.de_la, pentru: ded.pentru }
      : null,
  });
}
