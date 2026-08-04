import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verificaMesaj } from '@/lib/filtru';
import { verificaRateLimit, ipDinRequest } from '@/lib/rate-limit';
import type { TipDedicatie, Event, Tarif, Dedicatie } from '@/lib/types';

export interface CorpDedicatie {
  tip: TipDedicatie;
  de_la?: string;
  pentru?: string;
  artist_preferat?: string;
  mesaj?: string;
  src?: string;
  event_id: string;
  poza_path?: string;
}

type RezultatPregatire =
  | { eroare: NextResponse; event?: undefined; tarif?: undefined; ded?: undefined }
  | { eroare?: undefined; event: Event; tarif: Tarif; ded: Dedicatie };

// Validarea si insert-ul dedicatiei sunt identice indiferent de calea de plata
// aleasa (Stripe Checkout clasic sau Express Checkout Element — Sarcina E).
// Diferenta dintre /api/checkout si /api/payment-intent incepe abia dupa acest pas.
export async function pregatesteDedicatie(req: Request, body: CorpDedicatie): Promise<RezultatPregatire> {
  if (!verificaRateLimit(ipDinRequest(req))) {
    return {
      eroare: NextResponse.json(
        { error: 'Prea multe cereri. Te rugăm să încerci din nou peste câteva minute.' },
        { status: 429 }
      ),
    };
  }

  const { tip, de_la, pentru, artist_preferat, mesaj, src, event_id, poza_path } = body;

  if (!['sustinere', 'ecran', 'prezentator'].includes(tip)) {
    return { eroare: NextResponse.json({ error: 'Tip de dedicație invalid.' }, { status: 400 }) };
  }
  if (typeof event_id !== 'string' || event_id.length === 0) {
    return { eroare: NextResponse.json({ error: 'Ediția nu a fost specificată.' }, { status: 400 }) };
  }
  if (tip !== 'sustinere' && (!mesaj || String(mesaj).trim().length < 2)) {
    return { eroare: NextResponse.json({ error: 'Mesajul dedicației este obligatoriu.' }, { status: 400 }) };
  }
  if (tip !== 'sustinere' && !verificaMesaj(String(mesaj)).curat) {
    return {
      eroare: NextResponse.json(
        { error: 'Mesajul conține limbaj nepotrivit pentru acest show. Te rugăm să îl reformulezi.' },
        { status: 400 }
      ),
    };
  }

  const sb = supabaseAdmin();

  const { data: event } = await sb.from('events').select('*').eq('id', event_id).maybeSingle();
  if (!event) {
    return { eroare: NextResponse.json({ error: 'Ediția nu a fost găsită.' }, { status: 404 }) };
  }
  if (event.status === 'ended') {
    return {
      eroare: NextResponse.json(
        { error: 'Această ediție s-a încheiat. Vezi pagina principală pentru următoarea.' },
        { status: 409 }
      ),
    };
  }
  const esteRezervare = event.status === 'upcoming';

  const { data: tarif } = await sb
    .from('tarife')
    .select('*')
    .eq('event_id', event.id)
    .eq('tip', tip)
    .eq('activ', true)
    .maybeSingle();

  if (!tarif) {
    return { eroare: NextResponse.json({ error: 'Tariful nu este disponibil.' }, { status: 400 }) };
  }

  // Poza e permisa doar pentru dedicatiile de tip "ecran" (Sarcina D,
  // IMPLEMENTARE-V3.md) — modelul de model-change al V3 elimina orice
  // legatura intre dedicatii si transmisiuni online, iar poza citita de
  // prezentator sau la sustinere nu are unde sa fie afisata.
  if (typeof poza_path === 'string' && poza_path.length > 0 && tip !== 'ecran') {
    return { eroare: NextResponse.json({ error: 'Poza este permisă doar pentru dedicația pe ecran.' }, { status: 400 }) };
  }

  // O problema la poza nu trebuie sa blocheze plata (Sarcina B) — o ignoram
  // pur si simplu daca nu e valida.
  let pozaValidata: string | null = null;
  if (typeof poza_path === 'string' && poza_path.length > 0 && tip === 'ecran') {
    const { data: fisiere } = await sb.storage.from('poze-in-verificare').list('', { search: poza_path });
    if (fisiere?.some((f) => f.name === poza_path)) {
      pozaValidata = poza_path;
    }
  }

  const { data: ded, error: insErr } = await sb
    .from('dedicatii')
    .insert({
      event_id: event.id,
      tip,
      suma_bani: tarif.pret_bani,
      de_la: de_la?.slice(0, 80) ?? null,
      pentru: pentru?.slice(0, 80) ?? null,
      artist_preferat: artist_preferat?.slice(0, 80) ?? null,
      mesaj: mesaj?.slice(0, 300) ?? null,
      sursa_platforma: typeof src === 'string' ? src.slice(0, 30) : 'direct',
      este_rezervare: esteRezervare,
      poza_path: pozaValidata,
    })
    .select()
    .single();

  if (insErr || !ded) {
    return { eroare: NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 }) };
  }

  return { event: event as Event, tarif: tarif as Tarif, ded: ded as Dedicatie };
}
