import { supabaseAdmin } from '@/lib/supabase/admin';
import { StatusTimeline } from '@/components/StatusTimeline';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import type { DedicatieStatusPublic } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
      <>
        <Header />
        <main className="container">
          <div className="brand">12 Rounds</div>
          <h1>Dedicația nu a fost găsită</h1>
          <p className="sub">Verifică linkul din confirmarea plății.</p>
          <Link href="/">Înapoi la prima pagină</Link>
          <Footer />
        </main>
      </>
    );
  }

  const ded = data as DedicatieStatusPublic;

  return (
    <>
      <Header />
      <main className="container">
        <div className="brand">12 Rounds</div>
        <h1>Statusul dedicației tale</h1>
        <p className="sub">
          {ded.pentru ? `Pentru ${ded.pentru}` : 'Mulțumim pentru susținere!'} — pagina se
          actualizează automat.
        </p>
        <StatusTimeline initial={ded} />
        <Footer />
      </main>
    </>
  );
}
