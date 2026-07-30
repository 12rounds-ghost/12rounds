import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusTimeline } from '@/components/StatusTimeline';
import { Footer } from '@/components/Footer';
import type { DedicatieStatusPublic, Event } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const LINK_PLATFORMA: Record<string, string> = {
  yt: 'youtube', youtube: 'youtube',
  fb: 'facebook', facebook: 'facebook',
  tt: 'tiktok', tiktok: 'tiktok',
  ig: 'instagram', instagram: 'instagram',
  tg: 'telegram', telegram: 'telegram',
};

const CAMPURI_PUBLICE =
  'id, tip, pentru, de_la, status_plata, status_moderare, status_difuzare, motiv_respingere, event_id, sursa_platforma';

export default async function StatusPage({ params }: { params: { id: string } }) {
  // Randarea initiala citeste direct prin service role (server-side, nu expune
  // cheia in client) — la fel ca /api/status/[id], pe care se bazeaza si
  // StatusTimeline pentru actualizari ulterioare (polling).
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('dedicatii')
    .select(CAMPURI_PUBLICE)
    .eq('id', params.id)
    .maybeSingle();

  if (!data) {
    return (
      <main className="container">
        <div className="brand">12 Rounds</div>
        <h1>Dedicația nu a fost găsită</h1>
        <p className="sub">Verifică linkul din confirmarea plății.</p>
        <Link href="/">Înapoi la prima pagină</Link>
        <Footer />
      </main>
    );
  }

  const ded = data as DedicatieStatusPublic;
  const { data: ev } = await sb.from('events').select('*').eq('id', ded.event_id).maybeSingle();
  const platforma = LINK_PLATFORMA[ded.sursa_platforma] ?? null;
  const linkInapoi = platforma ? (ev as Event | null)?.linkuri_stream?.[platforma] : null;

  return (
    <main className="container">
      <div className="brand">12 Rounds</div>
      <h1>Statusul dedicației tale</h1>
      <p className="sub">
        {ded.pentru ? `Pentru ${ded.pentru}` : 'Mulțumim pentru susținere!'} — pagina se
        actualizează automat.
      </p>
      <StatusTimeline initial={ded} />
      {linkInapoi && (
        <a className="btn secondary" href={linkInapoi}>
          ← Înapoi la transmisiunea live
        </a>
      )}
      <Footer />
    </main>
  );
}
