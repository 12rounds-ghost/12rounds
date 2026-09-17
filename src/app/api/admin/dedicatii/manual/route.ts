import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { obtineModeratorApi } from '@/lib/auth-admin';
import type { TipDedicatie } from '@/lib/types';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

const TIPURI_VALIDE: TipDedicatie[] = ['sustinere', 'ecran', 'stream', 'prezentator'];

// Adaugare manuala din admin, fara Stripe — rezerva pentru cazul in care
// platile online au o problema/blocaj (Sarcina: backup dedicatii). Ocoleste
// complet checkout-ul si webhook-ul: dedicatia intra direct 'paid', ca sa fie
// imediat eligibila pentru difuzare (revendica_dedicatie / avanseaza_overlay_stream
// cer strict status_plata = 'paid'). Marcata cu sursa_platforma distincta,
// ca sa poata fi gasita/filtrata separat de platile reale in /admin/dedicatii
// si in rapoartele de venituri (suma_bani ramane ce a introdus admin-ul —
// 0 pentru o dedicatie oferita gratuit, sau suma reala daca a fost incasata
// prin alt canal, ex. cash/transfer).
// Doar admin — la fel ca rambursarea (bani/continut publicat fara moderarea
// standard), nu moderator/operator.
export async function POST(req: Request) {
  const mod = await obtineModeratorApi();
  if (!mod) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  if (mod.rol !== 'admin') return NextResponse.json({ error: 'Fără drepturi' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corp de cerere invalid.' }, { status: 400 });

  const {
    event_id,
    tip,
    de_la,
    pentru,
    artist_preferat,
    mesaj,
    suma_lei,
    aproba_automat,
  } = body as Record<string, unknown>;

  if (typeof event_id !== 'string' || !event_id) {
    return NextResponse.json({ error: 'Ediția este obligatorie.' }, { status: 400 });
  }
  if (typeof tip !== 'string' || !TIPURI_VALIDE.includes(tip as TipDedicatie)) {
    return NextResponse.json({ error: 'Tip de dedicație invalid.' }, { status: 400 });
  }
  if (tip !== 'sustinere' && (typeof mesaj !== 'string' || mesaj.trim().length < 2)) {
    return NextResponse.json({ error: 'Mesajul este obligatoriu pentru acest tip.' }, { status: 400 });
  }
  const sumaBani = typeof suma_lei === 'number' && suma_lei >= 0 ? Math.round(suma_lei * 100) : 0;

  const admin = supabaseAdmin();
  const { data: event } = await admin.from('events').select('id, status').eq('id', event_id).maybeSingle();
  if (!event) return NextResponse.json({ error: 'Ediția nu a fost găsită.' }, { status: 404 });

  const acum = new Date().toISOString();
  const aprobaAutomat = aproba_automat !== false; // implicit true — vezi comentariul din formular

  const { data: ded, error } = await admin
    .from('dedicatii')
    .insert({
      event_id,
      tip,
      suma_bani: sumaBani,
      de_la: typeof de_la === 'string' ? de_la.trim().slice(0, 80) || null : null,
      pentru: typeof pentru === 'string' ? pentru.trim().slice(0, 80) || null : null,
      artist_preferat: typeof artist_preferat === 'string' ? artist_preferat.trim().slice(0, 80) || null : null,
      mesaj: typeof mesaj === 'string' ? mesaj.trim().slice(0, 300) || null : null,
      sursa_platforma: 'admin-manual',
      status_plata: 'paid',
      platit_la: acum,
      status_moderare: aprobaAutomat ? 'aprobat' : 'in_verificare',
      moderat_la: aprobaAutomat ? acum : null,
      moderator_id: aprobaAutomat ? mod.id : null,
      este_rezervare: event.status === 'upcoming',
    })
    .select('id')
    .single();

  if (error || !ded) {
    console.error('Nu am putut adăuga dedicația manuală', error);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: ded.id });
}
