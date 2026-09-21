import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { urlPozaAprobata } from '@/lib/storage';
import type { Ecran } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DURATA_IMPLICITA_SECUNDE = 12;
// Cat asteapta un ecran intre doua sondari cand nu are nimic de aratat.
const DURATA_INACTIV_SECUNDE = 20;
// De cate ori poate fi difuzata o dedicatie pe ecranele din sala (Sarcina: fara
// bucla infinita).
const MAX_DIFUZARI = 2;

// Ce afiseaza un ecran: o dedicatie, logo-ul 12 ROUNDS (cand nu e nimic de
// aratat sau show-ul nu e live) sau nimic (ecran dezactivat din admin).
// Codul QR a fost scos de pe ecranele din sala (Sarcina: modificari 12 ROUNDS).
type Continut =
  | {
      tip: 'dedicatie';
      // id + momentul difuzarii: identifica O difuzare, nu doar dedicatia — a
      // doua difuzare a aceleiasi dedicatii trebuie sa ruleze din nou.
      cheie: string;
      mesaj: string | null;
      de_la: string | null;
      pentru: string | null;
      poza_url: string | null;
      cadou: string | null;
    }
  | { tip: 'branding' }
  | { tip: 'inactiv' };

// POST cu {id, key} in body, NU GET /api/ecran/[id]/next — in productie, un
// Route Handler GET cu segment dinamic [id] a ramas inghetat la primul
// raspuns calculat pentru fiecare id, in ciuda export const dynamic =
// 'force-dynamic' (comportament de cache la nivel de platforma, dovedit
// direct: acelasi ecran, acelasi token din DB, dar "Acces refuzat" pentru ca
// randul din Storage era cache-uit cu tokenul dinaintea unei regenerari).
// Ruta fara segment dinamic + POST s-a dovedit intotdeauna proaspata.
//
// Sarcina: ecranele din sala arata aceeasi dedicatie in acelasi moment — nu mai
// revendica fiecare ecran pe cont propriu. Apelam avanseaza_ecrane_sala
// (0025_ecrane_sala_sincronizate.sql), care tine "ce ruleaza acum si pana
// cand" pe evenimentul insusi; oricate ecrane sondeaza, vad aceeasi difuzare.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.id;
  const key = body?.key;
  if (typeof id !== 'string' || typeof key !== 'string' || !key) {
    return NextResponse.json({ error: 'Acces refuzat.' }, { status: 401 });
  }

  const sb = supabaseAdmin();

  const { data: ecranData } = await sb.from('ecrane').select('*').eq('id', id).maybeSingle();
  const ecran = ecranData as Ecran | null;
  if (!ecran) {
    return NextResponse.json({ error: 'Ecran inexistent.' }, { status: 404 });
  }

  const secretGlobal = process.env.ECRAN_SECRET;
  if (key !== ecran.token && !(secretGlobal && key === secretGlobal)) {
    return NextResponse.json({ error: 'Acces refuzat.' }, { status: 401 });
  }

  if (!ecran.activ) {
    await sb.from('ecrane').update({ ultima_cerere: new Date().toISOString() }).eq('id', ecran.id);
    return NextResponse.json({ durata_secunde: DURATA_INACTIV_SECUNDE, continut: { tip: 'inactiv' } as Continut });
  }

  // Doar un eveniment LIVE difuzeaza dedicatii. Dupa "Încheie show-ul" din
  // admin (status 'ended') sau inainte de pornire, ecranul arata logo-ul.
  const { data: event } = await sb
    .from('events')
    .select('id, durata_afisare_secunde')
    .eq('status', 'live')
    .maybeSingle();

  if (!event) {
    await sb.from('ecrane').update({ ultima_cerere: new Date().toISOString() }).eq('id', ecran.id);
    return NextResponse.json({ durata_secunde: DURATA_INACTIV_SECUNDE, continut: { tip: 'branding' } as Continut });
  }

  const durata = event.durata_afisare_secunde || DURATA_IMPLICITA_SECUNDE;

  const { data: rezultat, error } = await sb.rpc('avanseaza_ecrane_sala', {
    p_event_id: event.id,
    p_durata_secunde: durata,
    p_max_difuzari: MAX_DIFUZARI,
  });
  if (error) console.error('avanseaza_ecrane_sala a esuat', error);

  const ded =
    (
      rezultat as
        | {
            id: string;
            mesaj: string | null;
            de_la: string | null;
            pentru: string | null;
            cadou: string | null;
            poza_path: string | null;
            poza_aprobata: boolean;
            afisata_la: string;
          }[]
        | null
    )?.[0] ?? null;

  await sb
    .from('ecrane')
    .update({ ultima_cerere: new Date().toISOString(), ultima_dedicatie_id: ded?.id ?? null })
    .eq('id', ecran.id);

  if (!ded) {
    // Nicio dedicatie (inca) aprobata sau toate au fost deja aratate de
    // MAX_DIFUZARI ori — logo, nu ecran negru.
    return NextResponse.json({ durata_secunde: durata, continut: { tip: 'branding' } as Continut });
  }

  return NextResponse.json({
    durata_secunde: durata,
    continut: {
      tip: 'dedicatie',
      cheie: `${ded.id}|${ded.afisata_la}`,
      mesaj: ded.mesaj,
      de_la: ded.de_la,
      pentru: ded.pentru,
      // Layout-ul fotografiei (orientare, cadru) e gestionat de kit-ul
      // RoundsAnimation — nu mai avem nevoie de dimensiuni aici.
      poza_url: ded.poza_aprobata && ded.poza_path ? urlPozaAprobata(ded.poza_path) : null,
      cadou: ded.cadou,
    } as Continut,
  });
}
