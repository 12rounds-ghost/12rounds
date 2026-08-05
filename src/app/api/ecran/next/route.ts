import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { urlPozaAprobata, urlSponsorLogo } from '@/lib/storage';
import type { Dedicatie, Ecran, Sponsor } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DURATA_IMPLICITA_SECUNDE = 12;
const DURATA_INACTIV_SECUNDE = 20;

// Continutul afisat cand e randul umpluturii — se roteste, in ordine de
// prioritate, intre QR (cheama publicul sa trimita o dedicatie), un sponsor
// si branding simplu (Sarcina V4-A3, IMPLEMENTARE-V4.md).
type Filler =
  | { tip: 'qr'; url: string; qr_data_url: string }
  | { tip: 'sponsor'; nume: string; logo_url: string }
  | { tip: 'branding' }
  | { tip: 'inactiv' };

// POST cu {id, key} in body, NU GET /api/ecran/[id]/next — in productie, un
// Route Handler GET cu segment dinamic [id] a ramas inghetat la primul
// raspuns calculat pentru fiecare id, in ciuda export const dynamic =
// 'force-dynamic' (comportament de cache la nivel de platforma, dovedit
// direct: acelasi ecran, acelasi token din DB, dar "Acces refuzat" pentru ca
// randul din Storage era cache-uit cu tokenul dinaintea unei regenerari).
// Ruta fara segment dinamic + POST s-a dovedit intotdeauna proaspata.
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
    return NextResponse.json({ durata_secunde: DURATA_INACTIV_SECUNDE, continut: { tip: 'inactiv' } as Filler });
  }

  const { data: event } = await sb
    .from('events')
    .select('id, slug, durata_afisare_secunde')
    .eq('status', 'live')
    .maybeSingle();

  if (!event) {
    await sb.from('ecrane').update({ ultima_cerere: new Date().toISOString() }).eq('id', ecran.id);
    return NextResponse.json({
      durata_secunde: DURATA_INACTIV_SECUNDE,
      continut: { tip: 'branding' } as Filler,
    });
  }

  const durata = event.durata_afisare_secunde || DURATA_IMPLICITA_SECUNDE;

  // A3: alternam strict dedicatie/umplere. Fara asta, reciclarea din
  // revendica_dedicatie gaseste mereu candidat (macar cel deja aratat) si
  // umplutura nu mai apare niciodata dupa prima dedicatie difuzata.
  const incearcaDedicatie = ecran.ultimul_tip !== 'dedicatie';

  if (incearcaDedicatie) {
    const { data: revendicate } = await sb.rpc('revendica_dedicatie', {
      p_event_id: event.id,
      p_ecran_id: ecran.id,
    });
    const ded = (revendicate as Dedicatie[] | null)?.[0] ?? null;

    if (ded) {
      await sb
        .from('ecrane')
        .update({ ultima_cerere: new Date().toISOString(), ultimul_tip: 'dedicatie', ultima_dedicatie_id: ded.id })
        .eq('id', ecran.id);
      return NextResponse.json({
        durata_secunde: durata,
        continut: {
          tip: 'dedicatie',
          mesaj: ded.mesaj,
          de_la: ded.de_la,
          pentru: ded.pentru,
          poza_url: ded.poza_aprobata && ded.poza_path ? urlPozaAprobata(ded.poza_path) : null,
          poza_latime: ded.poza_latime,
          poza_inaltime: ded.poza_inaltime,
        },
      });
    }
    // Zero dedicatii aprobate in tot sistemul — nu exista ce revendica,
    // trecem la umplutura mai jos, fara eroare si fara ecran negru.
  }

  const filler = await alegeFiller(sb, ecran, event.id, event.slug);
  await sb.from('ecrane').update({ ultima_cerere: new Date().toISOString(), ultimul_tip: 'umplere' }).eq('id', ecran.id);
  return NextResponse.json({ durata_secunde: durata, continut: filler });
}

async function alegeFiller(
  sb: ReturnType<typeof supabaseAdmin>,
  ecran: Ecran,
  eventId: string,
  slug: string
): Promise<Filler> {
  const { data: sponsoriData } = await sb
    .from('sponsori')
    .select('*')
    .eq('activ', true)
    .or(`event_id.eq.${eventId},event_id.is.null`);
  const sponsoriCuLogo = ((sponsoriData ?? []) as Sponsor[]).filter((s) => s.logo_path);

  // Ordine de prioritate fixa: QR, apoi sponsor (daca exista), apoi branding.
  const variante: Filler['tip'][] = ['qr', ...(sponsoriCuLogo.length > 0 ? (['sponsor'] as const) : []), 'branding'];
  const ales = variante[ecran.filler_index % variante.length];
  await sb
    .from('ecrane')
    .update({ filler_index: (ecran.filler_index + 1) % variante.length })
    .eq('id', ecran.id);

  if (ales === 'sponsor') {
    const sponsor = sponsoriCuLogo[Math.floor(Math.random() * sponsoriCuLogo.length)];
    return { tip: 'sponsor', nume: sponsor.nume, logo_url: urlSponsorLogo(sponsor.logo_path as string) };
  }

  if (ales === 'qr') {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/eveniment/${slug}?src=ecran`;
    const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 400 });
    return { tip: 'qr', url, qr_data_url: qrDataUrl };
  }

  return { tip: 'branding' };
}
