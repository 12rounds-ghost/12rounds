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
  poza_latime?: number;
  poza_inaltime?: number;
  nume_facturare?: string;
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

  const { tip, de_la, pentru, artist_preferat, mesaj, src, event_id, poza_path, poza_latime, poza_inaltime, nume_facturare } = body;

  if (!['sustinere', 'ecran', 'prezentator'].includes(tip)) {
    return { eroare: NextResponse.json({ error: 'Tip de dedicație invalid.' }, { status: 400 }) };
  }
  if (typeof event_id !== 'string' || event_id.length === 0) {
    return { eroare: NextResponse.json({ error: 'Ediția nu a fost specificată.' }, { status: 400 }) };
  }
  // Sarcina V4-F (IMPLEMENTARE-V4.md): numele nu mai e garantat de campul
  // 'auto' al Payment Element-ului la cardul obisnuit — il cerem explicit,
  // in formular, inainte de butoanele de plata. Validarea din interfata nu
  // e suficienta, o repetam aici.
  const numeCurat = typeof nume_facturare === 'string' ? nume_facturare.trim() : '';
  if (numeCurat.length < 3 || !numeCurat.includes(' ')) {
    return {
      eroare: NextResponse.json(
        { error: 'Numele complet este obligatoriu pentru factură (nume și prenume).' },
        { status: 400 }
      ),
    };
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
  let pozaLatimeValidata: number | null = null;
  let pozaInaltimeValidata: number | null = null;
  if (typeof poza_path === 'string' && poza_path.length > 0 && tip === 'ecran') {
    const { data: fisiere } = await sb.storage.from('poze-in-verificare').list('', { search: poza_path });
    if (fisiere?.some((f) => f.name === poza_path)) {
      pozaValidata = poza_path;
      pozaLatimeValidata = typeof poza_latime === 'number' && poza_latime > 0 ? Math.round(poza_latime) : null;
      pozaInaltimeValidata = typeof poza_inaltime === 'number' && poza_inaltime > 0 ? Math.round(poza_inaltime) : null;
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
      poza_latime: pozaLatimeValidata,
      poza_inaltime: pozaInaltimeValidata,
      nume_facturare: numeCurat,
    })
    .select()
    .single();

  if (insErr || !ded) {
    return { eroare: NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 }) };
  }

  return { event: event as Event, tarif: tarif as Tarif, ded: ded as Dedicatie };
}
