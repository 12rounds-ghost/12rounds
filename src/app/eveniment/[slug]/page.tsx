import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { DedicationForm } from '@/components/DedicationForm';
import { Footer } from '@/components/Footer';
import { urlCoperta } from '@/lib/storage';
import { calculeazaStatisticiPublice } from '@/lib/statistici-publice';
import type { Event, Tarif } from '@/lib/types';

export const dynamic = 'force-dynamic';

const NUME_PLATFORMA: Record<string, string> = {
  youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', telegram: 'Telegram',
};

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
  const linkuriStream = Object.entries(event.linkuri_stream ?? {});

  return (
    <main className="container">
      <div
        className="eveniment-cover"
        style={{ backgroundImage: `url(${urlCoperta(event.cover_path)})` }}
      >
        <div className="eveniment-cover-overlay">
          {event.status === 'live' && <span className="badge-eveniment live pulsand">● LIVE ACUM</span>}
          {event.status === 'upcoming' && <span className="badge-eveniment upcoming">URMEAZĂ</span>}
          {event.status === 'ended' && <span className="badge-eveniment ended">ÎNCHEIAT</span>}
          <h1>{event.nume}</h1>
          {event.subtitlu && <p className="sub" style={{ margin: 0 }}>{event.subtitlu}</p>}
        </div>
      </div>

      <div className="eveniment-meta">
        {event.data_show && (
          <span>
            📅{' '}
            {new Date(event.data_show).toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' })}
          </span>
        )}
        {event.locatie && <span>📍 {event.locatie}</span>}
        {(event.artist_a || event.artist_b) && (
          <span>
            🎤 {event.artist_a}
            {event.artist_a && event.artist_b ? ' vs ' : ''}
            {event.artist_b}
          </span>
        )}
      </div>

      {event.descriere && <p className="eveniment-descriere">{event.descriere}</p>}

      {event.status === 'live' && (
        <>
          <div className="brand">● Live acum</div>
          <h2 style={{ textAlign: 'center' }}>Trimite o dedicație</h2>
          {tarife.length > 0 ? (
            <DedicationForm tarife={tarife} src={searchParams.src ?? 'direct'} eventId={event.id} eventSlug={event.slug} />
          ) : (
            <div className="card">Momentan nu sunt tarife active pentru această ediție.</div>
          )}
        </>
      )}

      {event.status === 'upcoming' && (
        <>
          <div className="brand">Rezervare</div>
          <h2 style={{ textAlign: 'center' }}>Rezervă o dedicație</h2>
          {tarife.length > 0 ? (
            <>
              <p className="sub">
                Plătești acum, mesajul intră în coadă imediat ce ediția devine live.
              </p>
              <DedicationForm tarife={tarife} src={searchParams.src ?? 'direct'} eventId={event.id} eventSlug={event.slug} />
            </>
          ) : (
            <div className="card">Rezervările pentru această ediție nu sunt încă deschise.</div>
          )}
        </>
      )}

      {event.status === 'ended' && statistici && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Statistici</h2>
          <div className="rand">
            <span>Dedicații difuzate</span>
            <strong>{statistici.difuzate}</strong>
          </div>
          <div className="rand">
            <span>Susținători</span>
            <strong>{statistici.sustinatori}</strong>
          </div>
          {statistici.topArtisti.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>Cei mai ceruți artiști</h3>
              <ol style={{ color: 'var(--muted)', fontSize: 14, paddingLeft: 20 }}>
                {statistici.topArtisti.map((a) => (
                  <li key={a.artist}>
                    {a.artist} <span style={{ color: 'var(--text)' }}>({a.numar})</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          {statistici.mesajeSelectie.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>Câteva mesaje</h3>
              {statistici.mesajeSelectie.map((m, i) => (
                <div key={i} className="mesaj-selectie">
                  „{m.mesaj}”{m.pentru && <span style={{ color: 'var(--muted)' }}> — pentru {m.pentru}</span>}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {event.status === 'ended' && linkuriStream.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Înregistrări</h2>
          <div className="rand" style={{ justifyContent: 'flex-start', gap: 16 }}>
            {linkuriStream.map(([platforma, link]) => (
              <a key={platforma} href={link} target="_blank" rel="noopener noreferrer">
                {NUME_PLATFORMA[platforma] ?? platforma}
              </a>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
