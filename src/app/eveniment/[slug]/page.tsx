import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { DedicationForm } from '@/components/DedicationForm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StareBadge } from '@/components/StareBadge';
import { GalerieFoto } from '@/components/GalerieFoto';
import { urlCoperta } from '@/lib/storage';
import { calculeazaStatisticiPublice } from '@/lib/statistici-publice';
import type { Event, Tarif, PozaGalerie } from '@/lib/types';

export const dynamic = 'force-dynamic';

const NUME_PLATFORMA: Record<string, string> = {
  youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', telegram: 'Telegram',
};

const PROVOCARI = ['Signature', 'Exchange', 'Emotion', 'Roots', 'Freestyle', 'Power + Surprise'];

export default async function EvenimentPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { src?: string };
}) {
  const sb = supabaseServer();
  const { data } = await sb.from('events').select('*').eq('slug', params.slug).maybeSingle();
  if (!data) notFound();
  const event = data as Event;

  let tarife: Tarif[] = [];
  if (event.status !== 'ended') {
    const { data: tarifeData } = await sb
      .from('tarife')
      .select('*')
      .eq('event_id', event.id)
      .eq('activ', true)
      .order('pret_bani');
    tarife = (tarifeData ?? []) as Tarif[];
  }

  const statistici = event.status === 'ended' ? await calculeazaStatisticiPublice(event.id) : null;

  let galerie: PozaGalerie[] = [];
  let urmatoareaEditie: Event | null = null;
  if (event.status === 'ended') {
    const [{ data: galerieData }, { data: viitoareData }] = await Promise.all([
      sb.from('galerie').select('*').eq('event_id', event.id).order('ordine', { ascending: true }),
      sb
        .from('events')
        .select('*')
        .in('status', ['live', 'upcoming'])
        .order('created_at', { ascending: false })
        .limit(1),
    ]);
    galerie = (galerieData ?? []) as PozaGalerie[];
    urmatoareaEditie = ((viitoareData ?? [])[0] as Event) ?? null;
  }

  const numePlatformeStream = Object.keys(event.linkuri_stream ?? {})
    .map((p) => NUME_PLATFORMA[p] ?? p)
    .join(' · ');

  return (
    <>
      <Header />

      <div className="eveniment-banner">
        <Image
          src={urlCoperta(event.cover_path)}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="eveniment-banner-veil" />
        <div className="eveniment-banner-content">
          <StareBadge
            status={event.status}
            dataScurta={
              event.data_show
                ? new Date(event.data_show).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
                : null
            }
          />
          <h1>{event.nume}</h1>
          {event.subtitlu && <p className="sub">{event.subtitlu}</p>}
        </div>
      </div>

      <div className="infobar">
        <div className="infobar-inner">
          {event.data_show && (
            <div>
              <i>Data</i>
              <b>{new Date(event.data_show).toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' })}</b>
            </div>
          )}
          {event.locatie && (
            <div>
              <i>Locație</i>
              <b>{event.locatie}</b>
            </div>
          )}
          {(event.artist_a || event.artist_b) && (
            <div>
              <i>Confruntarea</i>
              <b>
                {event.artist_a}
                {event.artist_a && event.artist_b ? ' vs. ' : ''}
                {event.artist_b}
              </b>
            </div>
          )}
          <div>
            <i>Durată</i>
            <b>≈85 de minute</b>
          </div>
          {numePlatformeStream && (
            <div>
              <i>Transmisie</i>
              <b>{numePlatformeStream}</b>
            </div>
          )}
        </div>
      </div>

      <main className="container wide">
        {event.status !== 'ended' ? (
          <div className="eveniment-doua-coloane" style={{ marginTop: 32 }}>
            <div className="prose">
              {event.descriere &&
                event.descriere.split('\n').filter(Boolean).map((par, i) => <p key={i}>{par}</p>)}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, textTransform: 'uppercase', marginTop: event.descriere ? 26 : 0 }}>
                Cele șase provocări
              </h3>
              <p className="eveniment-provocari-mini">
                {PROVOCARI.join(' · ')}. Aceleași reguli pentru amândoi artiștii, răspunsuri complet diferite.{' '}
                <Link href="/format">Vezi formatul complet →</Link>
              </p>
            </div>

            <aside className="eveniment-panel-sticky">
              {event.status === 'live' && (
                <div className="card">
                  <h3 style={{ marginTop: 0, textAlign: 'center' }}>Trimite o dedicație</h3>
                  <p className="sub">Doar pentru publicul din sală. Mesajul apare pe ecranele din sală, după aprobarea moderatorului.</p>
                  {tarife.length > 0 ? (
                    <DedicationForm tarife={tarife} src={searchParams.src ?? 'direct'} eventId={event.id} eventSlug={event.slug} />
                  ) : (
                    <div className="card">Momentan nu sunt tarife active pentru această ediție.</div>
                  )}
                </div>
              )}
              {event.status === 'upcoming' && (
                <div className="card">
                  <h3 style={{ marginTop: 0, textAlign: 'center' }}>Rezervă o dedicație</h3>
                  <p className="sub">
                    Plătești acum, mesajul intră în coadă imediat ce ediția devine live. Dacă ediția se anulează,
                    primești rambursare integrală.
                  </p>
                  {tarife.length > 0 ? (
                    <DedicationForm tarife={tarife} src={searchParams.src ?? 'direct'} eventId={event.id} eventSlug={event.slug} />
                  ) : (
                    <div className="card">Rezervările pentru această ediție nu sunt încă deschise.</div>
                  )}
                </div>
              )}
            </aside>
          </div>
        ) : (
          <>
            {event.descriere && (
              <div className="prose" style={{ marginTop: 32, maxWidth: '70ch' }}>
                {event.descriere.split('\n').filter(Boolean).map((par, i) => <p key={i}>{par}</p>)}
              </div>
            )}

            {statistici && (
              <section style={{ marginTop: 40 }}>
                <div className="shead">
                  <div><div className="kicker">Cifrele ediției</div><h2>Cum a arătat seara</h2></div>
                </div>
                <div className="bigstats">
                  <div><b>{statistici.difuzate}</b><span>Dedicații difuzate</span></div>
                  <div><b>{statistici.sustinatori}</b><span>Susținători</span></div>
                  {event.spectatori != null && <div><b>{event.spectatori.toLocaleString('ro-RO')}</b><span>Spectatori</span></div>}
                  {event.momente_live != null && <div><b>{event.momente_live}</b><span>Momente live</span></div>}
                </div>
              </section>
            )}

            {galerie.length > 0 && (
              <section style={{ marginTop: 44 }}>
                <div className="shead">
                  <div><div className="kicker">Galerie</div><h2>Imagini din sală</h2></div>
                </div>
                <GalerieFoto poze={galerie} />
              </section>
            )}

            {statistici && statistici.topArtisti.length > 0 && (
              <section style={{ marginTop: 44 }}>
                <div className="shead">
                  <div><div className="kicker">Din sală</div><h2>Cel mai cerut artist</h2></div>
                </div>
                <div className="card" style={{ display: 'inline-block' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{statistici.topArtisti[0].artist}</strong>
                  <span className="sub" style={{ margin: '4px 0 0' }}>{statistici.topArtisti[0].numar} dedicații</span>
                </div>
              </section>
            )}

            {urmatoareaEditie && (
              <section style={{ marginTop: 44, marginBottom: 8 }}>
                <div className="strip">
                  <h2>Nu rata ediția următoare</h2>
                  <p>{urmatoareaEditie.nume}{urmatoareaEditie.data_show ? ` — ${new Date(urmatoareaEditie.data_show).toLocaleDateString('ro-RO', { dateStyle: 'long' })}` : ''}</p>
                  <Link className="btn" href={`/eveniment/${urmatoareaEditie.slug}`}>Vezi ediția</Link>
                </div>
              </section>
            )}
          </>
        )}

        <Footer />
      </main>
    </>
  );
}
