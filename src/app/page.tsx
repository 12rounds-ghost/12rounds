import Link from 'next/link';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabase/server';
import { Footer } from '@/components/Footer';
import { EventGrid } from '@/components/EventGrid';
import { urlCoperta } from '@/lib/storage';
import type { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Fallback-uri pentru evenimente fara data_show, ca sa nu rupa sortarea:
// un 'upcoming' fara data trece la coada (crescator), un 'ended' fara data
// trece tot la coada (descrescator).
const DATA_MAXIMA = '9999-12-31';
const DATA_MINIMA = '0000-01-01';

function ordineEvenimente(a: Event, b: Event): number {
  const rang = (s: Event['status']) => (s === 'live' ? 0 : s === 'upcoming' ? 1 : 2);
  const diferentaRang = rang(a.status) - rang(b.status);
  if (diferentaRang !== 0) return diferentaRang;

  if (a.status === 'upcoming') {
    return (a.data_show ?? DATA_MAXIMA).localeCompare(b.data_show ?? DATA_MAXIMA);
  }
  if (a.status === 'ended') {
    return (b.data_show ?? DATA_MINIMA).localeCompare(a.data_show ?? DATA_MINIMA);
  }
  return b.created_at?.localeCompare(a.created_at ?? '') ?? 0;
}

export default async function Home({
  searchParams,
}: {
  searchParams: { fara_live?: string };
}) {
  const sb = supabaseServer();
  const { data } = await sb.from('events').select('*').order('created_at', { ascending: false }).limit(200);
  const evenimente = ((data ?? []) as Event[]).sort(ordineEvenimente);

  const hero = evenimente.find((e) => e.status === 'live') ?? null;
  const restul = evenimente.filter((e) => e.id !== hero?.id);

  return (
    <main className="container wide">
      <Image src="/logo.jpeg" alt="12 ROUNDS — The Battle of the Bands" width={130} height={130} className="logo" priority />
      <div className="brand">The battle of the bands</div>

      {!hero && searchParams.fara_live === '1' && (
        <p className="sub" style={{ textAlign: 'center' }}>
          Niciun show live acum — vezi mai jos următoarea ediție.
        </p>
      )}

      {hero && (
        <Link
          href={`/eveniment/${hero.slug}`}
          className="hero-eveniment"
          style={{ backgroundImage: `url(${urlCoperta(hero.cover_path)})` }}
        >
          <div className="hero-eveniment-overlay">
            <span className="badge-eveniment live pulsand">● LIVE ACUM</span>
            <h1>{hero.nume}</h1>
            {hero.subtitlu && <p className="sub" style={{ margin: '4px 0 16px' }}>{hero.subtitlu}</p>}
            <span className="btn" style={{ display: 'inline-block', width: 'auto', padding: '14px 32px' }}>
              Trimite o dedicație
            </span>
          </div>
        </Link>
      )}

      {restul.length > 0 && (
        <>
          <h2 style={{ marginTop: hero ? 32 : 12 }}>{hero ? 'Alte ediții' : 'Ediții'}</h2>
          <EventGrid evenimente={restul} />
        </>
      )}

      {evenimente.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>Nicio ediție anunțată încă.</div>
      )}

      <Footer />
    </main>
  );
}
