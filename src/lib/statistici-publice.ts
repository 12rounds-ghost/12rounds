import { supabaseAdmin } from './supabase/admin';
import type { TipDedicatie } from './types';

// Statistici publice pentru un eveniment incheiat. Doar agregate — niciodata
// sume, preturi, mesaje respinse sau date despre platitori (Sarcina C,
// IMPLEMENTARE-V2.md). Folosit atat de API route-ul public, cat si direct de
// pagina /eveniment/[slug] (Server Component -> nu are rost sa se auto-cheme
// prin fetch pentru propriul API route).
export interface StatisticiPublice {
  difuzate: number;
  sustinatori: number;
  topArtisti: { artist: string; numar: number }[];
  mesajeSelectie: { tip: TipDedicatie; pentru: string | null; mesaj: string }[];
}

export async function calculeazaStatisticiPublice(eventId: string): Promise<StatisticiPublice> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('dedicatii')
    .select('tip, status_moderare, status_difuzare, artist_preferat, pentru, mesaj')
    .eq('event_id', eventId)
    .eq('status_plata', 'paid');

  const randuri = data ?? [];
  const difuzate = randuri.filter((r) => r.status_difuzare === 'difuzat').length;
  const sustinatori = randuri.length;

  const numarPeArtist = new Map<string, number>();
  for (const r of randuri) {
    const artist = r.artist_preferat?.trim();
    if (artist) numarPeArtist.set(artist, (numarPeArtist.get(artist) ?? 0) + 1);
  }
  const topArtisti = Array.from(numarPeArtist.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([artist, numar]) => ({ artist, numar }));

  const mesajeSelectie = randuri
    .filter(
      (r) => r.status_moderare === 'aprobat' && r.tip !== 'sustinere' && r.mesaj && r.mesaj.trim().length > 1
    )
    .slice(0, 8)
    .map((r) => ({ tip: r.tip as TipDedicatie, pentru: r.pentru, mesaj: r.mesaj as string }));

  return { difuzate, sustinatori, topArtisti, mesajeSelectie };
}
