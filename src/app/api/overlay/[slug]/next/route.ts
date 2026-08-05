import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Dedicatie } from '@/lib/types';

const DURATA_FARA_EVENIMENT_SECUNDE = 15;

// Sarcina V4-G4 (IMPLEMENTARE-V4.md): overlay-ul se reconstruieste pentru
// tipul 'stream' — aceeasi logica de revendicare ca la ecranele din sala
// (FOR UPDATE SKIP LOCKED), dar cu propria coada (tip='stream', niciodata
// 'ecran'), propriul token (OVERLAY_SECRET) si propriul interval configurabil
// (event.durata_stream_secunde). Spre deosebire de ecran, nu reciclam — un
// overlay transparent peste un stream deja in direct nu are nevoie sa ramana
// mereu ocupat, ca un ecran fizic care altfel ar ramane negru.
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const secret = process.env.OVERLAY_SECRET;
  const key = new URL(req.url).searchParams.get('key');
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Acces refuzat.' }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: event } = await sb
    .from('events')
    .select('id, durata_stream_secunde')
    .eq('slug', params.slug)
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
