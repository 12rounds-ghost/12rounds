import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { urlPozaAprobata, urlSponsorLogo } from '@/lib/storage';
import type { Dedicatie, EcranConfig, Sponsor } from '@/lib/types';

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

// Endpoint token-protejat, apelat de fiecare ecran fizic din sala dupa ce
// termina de aratat continutul curent (Sarcina F, IMPLEMENTARE-V3.md).
// Fara ?key= corect, ecranul nu primeste niciodata date.
export async function GET(req: Request, { params }: { params: { nr: string } }) {
  const nr = Number(params.nr);
  if (!Number.isInteger(nr) || nr <= 0) {
    return NextResponse.json({ error: 'Ecran invalid.' }, { status: 400 });
  }

  const secret = process.env.ECRAN_SECRET;
  const key = new URL(req.url).searchParams.get('key');
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Acces refuzat.' }, { status: 401 });
  }

  const sb = supabaseAdmin();

  const { data: configData } = await sb
    .from('ecrane_config')
    .upsert({ nr, ultima_conectare: new Date().toISOString() }, { onConflict: 'nr' })
    .select()
    .single();
  const config = configData as EcranConfig | null;

  if (config && config.activ === false) {
    return NextResponse.json({ durata_secunde: DURATA_INACTIV_SECUNDE, continut: { tip: 'inactiv' } as Filler });
  }

  const { data: event } = await sb
    .from('events')
    .select('id, slug, durata_afisare_secunde')
    .eq('status', 'live')
    .maybeSingle();

  if (!event) {
    return NextResponse.json({
      durata_secunde: DURATA_INACTIV_SECUNDE,
      continut: { tip: 'branding' } as Filler,
    });
  }

  const durata = event.durata_afisare_secunde || DURATA_IMPLICITA_SECUNDE;

  // A3: alternam strict dedicatie/umplere. Fara asta, reciclarea din
  // revendica_dedicatie gaseste mereu candidat (macar cel deja aratat) si
  // umplutura nu mai apare niciodata dupa prima dedicatie difuzata.
  const incearcaDedicatie = config?.ultimul_tip !== 'dedicatie';

  if (incearcaDedicatie) {
    const { data: revendicate } = await sb.rpc('revendica_dedicatie', {
      p_event_id: event.id,
      p_ecran: nr,
    });
    const ded = (revendicate as Dedicatie[] | null)?.[0] ?? null;

    if (ded) {
      await sb.from('ecrane_config').update({ ultimul_tip: 'dedicatie' }).eq('nr', nr);
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

  const filler = await alegeFiller(sb, nr, config?.filler_index ?? 0, event.id, event.slug);
  await sb.from('ecrane_config').update({ ultimul_tip: 'umplere' }).eq('nr', nr);
  return NextResponse.json({ durata_secunde: durata, continut: filler });
}

async function alegeFiller(
  sb: ReturnType<typeof supabaseAdmin>,
  nr: number,
  filler_index: number,
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
  const ales = variante[filler_index % variante.length];
  await sb
    .from('ecrane_config')
    .update({ filler_index: (filler_index + 1) % variante.length })
    .eq('nr', nr);

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
