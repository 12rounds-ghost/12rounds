import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

// Creeaza un eveniment gol, cu tarifele implicite, gata de editat in
// /admin/evenimente/[id] (Sarcina D, IMPLEMENTARE-V2.md). Doar rolul admin.
export async function POST() {
  const mod = await obtineModeratorApi();
  if (!mod || mod.rol !== 'admin') {
    return NextResponse.json({ error: 'Fără drepturi.' }, { status: 403 });
  }

  const sb = supabaseAdmin();
  const slug = `eveniment-${crypto.randomUUID().slice(0, 8)}`;

  const { data: event, error } = await sb
    .from('events')
    .insert({ nume: 'Eveniment nou', slug, status: 'upcoming' })
    .select('id')
    .single();

  if (error || !event) {
    console.error('creare eveniment', error);
    return NextResponse.json({ error: 'Nu am putut crea evenimentul.' }, { status: 500 });
  }

  await sb.from('tarife').insert([
    { event_id: event.id, tip: 'sustinere', pret_bani: 2500 },
    { event_id: event.id, tip: 'ecran', pret_bani: 7500 },
    { event_id: event.id, tip: 'prezentator', pret_bani: 25000 },
  ]);

  return NextResponse.json({ id: event.id });
}
