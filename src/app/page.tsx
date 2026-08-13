import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EditiiUrmeaza } from '@/components/EditiiUrmeaza';
import { EditiiIncheiate } from '@/components/EditiiIncheiate';
import { SponsoriSection } from '@/components/SponsoriSection';
import { StareBadge } from '@/components/StareBadge';
import { urlCoperta } from '@/lib/storage';
import type { Event, Sponsor } from '@/lib/types';

export const dynamic = 'force-dynamic';

const NUMAR_EDITII_INCHEIATE = 3;

export default async function Home() {
  const sb = supabaseServer();
  const { data } = await sb.from('events').select('*').order('created_at', { ascending: false }).limit(200);
  const evenimente = (data ?? []) as Event[];

  const live = evenimente.find((e) => e.status === 'live') ?? null;
  const viitoare = evenimente
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => (a.data_show ?? '9999').localeCompare(b.data_show ?? '9999'));
  const incheiate = evenimente
    .filter((e) => e.status === 'ended')
    .sort((a, b) => (b.data_show ?? '').localeCompare(a.data_show ?? ''))
    .slice(0, NUMAR_EDITII_INCHEIATE);

  // Hero: editia live, sau — daca nu e nimic live — urmatoarea editie.
  const hero = live ?? viitoare[0] ?? null;
  const railViitoare = viitoare.filter((e) => e.id !== hero?.id);

  let difuzatePerEveniment = new Map<string, number>();
  if (incheiate.length > 0) {
    const { data: randuri } = await sb
      .from('dedicatii')
      .select('event_id')
      .eq('status_difuzare', 'difuzat')
      .eq('status_plata', 'paid')
      .in('event_id', incheiate.map((e) => e.id));
    difuzatePerEveniment = new Map();
    for (const r of randuri ?? []) {
      difuzatePerEveniment.set(r.event_id, (difuzatePerEveniment.get(r.event_id) ?? 0) + 1);
    }
  }

  const { data: sponsoriData } = await sb
    .from('sponsori')
    .select('*')
    .eq('activ', true)
    .or(hero ? `event_id.is.null,event_id.eq.${hero.id}` : 'event_id.is.null')
    .order('ordine', { ascending: true });
  const sponsori = (sponsoriData ?? []) as Sponsor[];

  return (
    <>
      <Header />
      <main className="container wide">
        {hero && (
          <div className="hero-eveniment-wrap">
            <Link
              href={`/eveniment/${hero.slug}`}
              className="hero-eveniment"
              style={{ backgroundImage: `url(${urlCoperta(hero.cover_path)})` }}
            >
              <div className="hero-eveniment-overlay">
                <StareBadge
                  status={hero.status === 'live' ? 'live' : 'upcoming'}
                  dataScurta={
                    hero.data_show
                      ? new Date(hero.data_show).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
                      : null
                  }
                />
                <h1>{hero.nume}</h1>
                <p className="sub" style={{ margin: '4px 0 16px' }}>
                  {hero.data_show &&
                    new Date(hero.data_show).toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' })}
                  {hero.locatie ? ` · ${hero.locatie}` : ''}
                  {(hero.artist_a || hero.artist_b) &&
                    ` · ${hero.artist_a ?? ''}${hero.artist_a && hero.artist_b ? ' vs ' : ''}${hero.artist_b ?? ''}`}
                </p>
                <span className="btn" style={{ display: 'inline-block', width: 'auto', padding: '14px 32px' }}>
                  {hero.status === 'live' ? 'Trimite o dedicație' : 'Vezi detalii'}
                </span>
                {hero.status === 'live' && (
                  <span className="hero-note">Dedicațiile se trimit din sală, în timpul show-ului</span>
                )}
              </div>
            </Link>
          </div>
        )}

        {!hero && (
          <div className="card" style={{ textAlign: 'center' }}>Nicio ediție anunțată încă.</div>
        )}

        {/* Formatul */}
        <section className="shead" style={{ marginTop: 40 }}>
          <div>
            <div className="kicker">Formatul</div>
            <h2>12 ROUNDS îi separă.<br />Ultima piesă îi aduce împreună.</h2>
          </div>
        </section>
        <div className="formula">
          <div><b>2</b><span>Artiști</span></div>
          <div><b>×6</b><span>Provocări fiecare</span></div>
          <div><b>12</b><span>Rounds</span></div>
          <div><b>+1</b><span>Grand Finale</span></div>
        </div>
        <div className="concept-cta">
          <div>
            <h3>Șase provocări. Două interpretări. Două identități.</h3>
            <p>Signature, Exchange, Emotion, Roots, Freestyle și Power + Surprise — aceleași reguli pentru amândoi artiștii, răspunsuri complet diferite.</p>
          </div>
          <Link className="btn" href="/format">Despre format</Link>
        </div>

        {/* Editii viitoare */}
        {railViitoare.length > 0 && (
          <section id="viitoare" style={{ marginTop: 48 }}>
            <div className="shead">
              <div><div className="kicker">Calendar</div><h2>Ediții care urmează</h2></div>
            </div>
            <EditiiUrmeaza evenimente={railViitoare} />
          </section>
        )}

        {/* Cum functioneaza dedicatiile */}
        <section style={{ marginTop: 48 }}>
          <div className="shead">
            <div>
              <div className="kicker">Dedicații · doar în sală</div>
              <h2>Mesajul tău, pe ecranele din sală</h2>
            </div>
          </div>
          <div className="steps">
            <div><h4>Scanezi codul QR</h4><p>De pe ecranele din sală, de pe masă sau de pe bilet.</p></div>
            <div><h4>Scrii mesajul</h4><p>De la cine, pentru cine, artistul preferat. Opțional, o poză.</p></div>
            <div><h4>Plătești</h4><p>Apple Pay, Google Pay sau card. Un singur tap, fără cont.</p></div>
            <div><h4>Apare pe ecran</h4><p>După aprobarea moderatorului, pe ecranele din sală.</p></div>
          </div>
        </section>

        {/* Editii incheiate */}
        {incheiate.length > 0 && (
          <section id="trecute" style={{ marginTop: 48 }}>
            <div className="shead">
              <div><div className="kicker">Arhivă</div><h2>Ediții încheiate</h2></div>
            </div>
            <EditiiIncheiate evenimente={incheiate} difuzatePerEveniment={difuzatePerEveniment} />
          </section>
        )}

        {/* Parteneri */}
        {sponsori.length > 0 && (
          <section id="sponsori" style={{ marginTop: 48 }}>
            <div className="shead">
              <div><div className="kicker">Parteneri</div><h2>Cei care fac show-ul posibil</h2></div>
            </div>
            <SponsoriSection sponsori={sponsori} />
          </section>
        )}

        {/* Banda finala */}
        <section style={{ marginTop: 48 }}>
          <div className="strip">
            <h2>Every 12 rounds have a story</h2>
            <p>Ești în sală? Trimite o dedicație și fii parte din ediția de diseară.</p>
            <Link className="btn" href={hero ? `/eveniment/${hero.slug}` : '/'}>Trimite o dedicație</Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
