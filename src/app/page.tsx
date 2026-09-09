import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Wave } from '@/components/Wave';
import { EditiiUrmeaza } from '@/components/EditiiUrmeaza';
import { EditiiIncheiate } from '@/components/EditiiIncheiate';
import { SponsoriSection } from '@/components/SponsoriSection';
import { urlCoperta } from '@/lib/storage';
import type { Event, Sponsor } from '@/lib/types';

export const dynamic = 'force-dynamic';

const NUMAR_EDITII_INCHEIATE = 3;

const PROVOCARI = [
  { nr: '01', nume: 'Signature', text: 'O piesă proprie care definește artistul.', simte: 'Identitate' },
  { nr: '02', nume: 'Exchange', text: 'O piesă din repertoriul celuilalt, reinventată.', simte: 'Respect' },
  { nr: '03', nume: 'Emotion', text: 'O baladă construită pe emoție.', simte: 'Emoție' },
  { nr: '04', nume: 'Roots', text: 'O piesă populară sau lăutărească, în stil propriu.', simte: 'Rădăcini' },
  { nr: '05', nume: 'Freestyle', text: 'Improvizație live pe beat-ul creat de DJ.', simte: 'Spontaneitate' },
  { nr: '06', nume: 'Power + Surprise', text: 'Energie maximă, alături de invitatul-surpriză.', simte: 'Explozie' },
];

const FAZE = [
  { eticheta: 'T−14 → T−1', titlu: 'Before', nr: '01', text: 'Reveal. Provocări. Indicii din repetiții. Reacții și creatori care aleg o parte.' },
  { eticheta: 'Show day', titlu: 'Live', nr: '02', text: 'Backstage, freestyle și invitați-surpriză. Energia din sală ajunge dincolo de scenă.' },
  { eticheta: 'T+1 → T+14 și mai departe', titlu: 'After', nr: '03', text: '12 round clips. Grand Finale. Highlights, reacții și concertul integral.' },
];

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
      <a className="skip-link" href="#concept">Sari la conținut</a>
      <Header />
      <main>
        {/* ============ HERO — full-bleed, gutter proprie ============ */}
        {hero && (
          <section className="hero" id="next-show">
            <div className="hero-meta">
              <span>
                <i className="live-dot" aria-hidden="true" />
                {hero.status === 'live' ? 'Live acum' : 'Next edition'}
              </span>
              <span>
                {hero.data_show &&
                  new Date(hero.data_show).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                {hero.locatie ? <> <b>/</b> {hero.locatie}</> : null}
              </span>
              <span className="hero-number">The Battle of the Bands</span>
            </div>

            <div className="hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">Premium live entertainment</p>
                <h1>
                  ONE NIGHT.
                  <br />
                  <span className="outline">TWO ARTISTS.</span>
                  <br />
                  TWELVE
                  <br />
                  <em>ROUNDS.</em>
                </h1>
                <p className="hero-desc">
                  Două lumi muzicale.
                  <br />O scenă. O poveste care se scrie live.
                </p>
                <div className="hero-actions">
                  <Link className="btn" href={hero.status === 'live' ? `/eveniment/${hero.slug}` : '#concept'}>
                    {hero.status === 'live' ? 'Trimite o dedicație' : 'Descoperă formatul'}
                  </Link>
                </div>
                <span className="hero-duration">
                  ≈ 85 minute <b>·</b> Fără juriu <b>·</b> Fără învinși
                </span>
              </div>

              <Link href={`/eveniment/${hero.slug}`} className="poster-stage">
                <div className="poster-label">
                  <span>Live in concert</span>
                  <span>12 Rounds</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="official-poster" src={urlCoperta(hero.cover_path)} alt={hero.nume} />
                {(hero.artist_a || hero.artist_b) && (
                  <div className="poster-caption">
                    {hero.artist_a && (
                      <span>
                        <span className="side-dot white" /> White side
                        <b>{hero.artist_a}</b>
                      </span>
                    )}
                    {hero.artist_a && hero.artist_b && <i>vs</i>}
                    {hero.artist_b && (
                      <span>
                        <span className="side-dot black" /> Black side
                        <b>{hero.artist_b}</b>
                      </span>
                    )}
                  </div>
                )}
                <Wave bare={48} />
              </Link>
            </div>

            <div className="hero-bottom">
              <p>Every 12 rounds have a story.</p>
              <a href="#concept">
                Intră în poveste
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </a>
            </div>
          </section>
        )}

        {!hero && (
          <div className="section-inner" style={{ marginTop: 24 }}>
            <div className="card" style={{ textAlign: 'center' }}>Nicio ediție anunțată încă.</div>
          </div>
        )}

        {/* ============ CONCEPT ============ */}
        <section id="concept" className="section-band panel-1">
          <div className="section-inner">
            <div className="section-label">
              <span>01 / Conceptul</span>
              <span>About and beyond the music</span>
            </div>
            <div className="shead">
              <h2>Nu este un concert dublu.<br />Este un show cu mecanism.</h2>
            </div>
            <p className="sub" style={{ textAlign: 'left', margin: '0 0 4px', maxWidth: '60ch' }}>
              Doi artiști cu identități muzicale diferite. Aceleași șase provocări. Răspunsuri complet diferite.
            </p>
            <p className="sub" style={{ textAlign: 'left', margin: '0 0 18px' }}>
              Diferența creează tensiunea. Muzica produce întâlnirea.
            </p>
            <div className="formula-big">
              <div className="formula-big-piece">
                <div><strong>2</strong><span>Artiști</span></div>
                <i>×</i>
              </div>
              <div className="formula-big-piece">
                <div><strong>6</strong><span>Provocări</span></div>
                <i>=</i>
              </div>
              <div className="formula-big-piece">
                <div><strong>12</strong><span>Rounds</span></div>
                <i>+</i>
              </div>
              <div className="formula-big-piece">
                <div><strong>1</strong><span>Grand Finale</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CELE ȘASE PROVOCĂRI ============ */}
        <section id="rounds" className="section-band">
          <div className="section-inner">
            <div className="section-label">
              <span>02 / The six challenges</span>
              <span>Aceleași reguli. Două interpretări.</span>
            </div>
            <div className="shead">
              <h2>Six challenges.<br /><span style={{ color: 'var(--muted)' }}>Twelve stories.</span></h2>
            </div>
            <p className="sub" style={{ textAlign: 'left', margin: '0 0 20px' }}>
              Fiecare provocare produce două interpretări. De la identitate la explozie.
            </p>
            <div className="challenge-list">
              {PROVOCARI.map((p) => (
                <div key={p.nr} className="challenge-row">
                  <span className="round-index">{p.nr}</span>
                  <h3>{p.nume}</h3>
                  <p>{p.text}</p>
                  <span className="challenge-feeling">
                    {p.simte}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M13 5H19V11" /><path d="M19 5L5 19" />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ GRAND FINALE ============ */}
        <section className="section-band">
          <div className="section-inner" style={{ textAlign: 'center' }}>
            <p className="section-label" style={{ justifyContent: 'center' }}>
              <span>03 / One grand finale</span>
            </p>
            <h2>12 Rounds îi separă.<br />Ultima piesă îi aduce împreună.</h2>
            <Wave />
            <p className="sub" style={{ marginTop: 20, marginBottom: 4 }}>
              Duet. Mash-up. Sau o piesă creată special pentru această ediție.
            </p>
            <p className="sub" style={{ fontSize: 12.5 }}>
              Grand Finale urmează celor 12 rounds. Un moment separat. O singură întâlnire.
            </p>
          </div>
        </section>

        {/* ============ BEYOND THE STAGE ============ */}
        <section id="live" className="section-band">
          <div className="section-inner">
            <div className="section-label">
              <span>04 / Beyond the stage</span>
              <span>O noapte. Mai mult decât un moment.</span>
            </div>
            <div className="shead">
              <h2>Show-ul nu se termină<br /><span style={{ color: 'var(--muted)' }}>la ultimul acord.</span></h2>
            </div>
            <div className="phases">
              {FAZE.map((f) => (
                <article key={f.nr}>
                  <span>{f.eticheta}</span>
                  <h3>{f.titlu}<span>{f.nr}</span></h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CREATOR LEAGUE ============ */}
        <section id="creators" className="section-band panel-2">
          <div className="section-inner">
            <div className="section-label"><span>05 / Creator league</span></div>
            <div className="creator-section">
              <h2>Don&rsquo;t just post.<br /><span style={{ color: 'var(--muted)' }}>Be part of<br />the story.</span></h2>
              <div>
                <p>
                  Creatorii sunt parteneri de distribuție. Recompensa lor reflectă valoarea verificabilă
                  creată: audiență, trafic, fani, vânzări și conținut care merge mai departe.
                </p>
                <p style={{ color: 'var(--muted)' }}>
                  Contribuție măsurată. Formulă transparentă. Rezultate proprii, accesibile în portal.
                </p>
                <Link className="btn secondary" href="/creator-league">Devino creator</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CUM TRIMIȚI O DEDICAȚIE ============ */}
        <section className="section-band">
          <div className="section-inner">
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
          </div>
        </section>

        {/* ============ EDIȚII VIITOARE ============ */}
        {railViitoare.length > 0 && (
          <section id="viitoare" className="section-band panel-1">
            <div className="section-inner">
              <div className="shead">
                <div><div className="kicker">Calendar</div><h2>Ediții care urmează</h2></div>
              </div>
              <EditiiUrmeaza evenimente={railViitoare} />
            </div>
          </section>
        )}

        {/* ============ ARHIVĂ ============ */}
        {incheiate.length > 0 && (
          <section id="trecute" className="section-band">
            <div className="section-inner">
              <div className="shead">
                <div><div className="kicker">Arhivă</div><h2>Ediții încheiate</h2></div>
              </div>
              <EditiiIncheiate evenimente={incheiate} difuzatePerEveniment={difuzatePerEveniment} />
            </div>
          </section>
        )}

        {/* ============ PARTENERI ============ */}
        {sponsori.length > 0 && (
          <section id="sponsori" className="section-band panel-2">
            <div className="section-inner">
              <div className="shead">
                <div><div className="kicker">Parteneri</div><h2>Cei care fac show-ul posibil</h2></div>
              </div>
              <SponsoriSection sponsori={sponsori} />
            </div>
          </section>
        )}

        {/* ============ BANDA FINALĂ DE DEDICAȚII ============ */}
        <section className="section-band tight">
          <div className="section-inner">
            <div className="dedication-teaser">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16.247 7.761a6 6 0 0 1 0 8.478" />
                  <path d="M19.075 4.933a10 10 0 0 1 0 14.134" />
                  <path d="M4.925 19.067a10 10 0 0 1 0-14.134" />
                  <path d="M7.753 16.239a6 6 0 0 1 0-8.478" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <div>
                  <p>Oamenii fac povestea.</p>
                  <h3>Mesajul tău. În 12 Rounds.</h3>
                </div>
              </div>
              <Link className="btn" style={{ width: 'auto', margin: 0 }} href={hero ? `/eveniment/${hero.slug}` : '/live'}>
                Trimite o dedicație
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
