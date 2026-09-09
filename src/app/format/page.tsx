import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Formatul — 12 ROUNDS' };

const PROVOCARI = [
  { nr: '01', nume: 'Signature', text: 'O piesă proprie care definește artistul.', simte: 'Identitate' },
  { nr: '02', nume: 'Exchange', text: 'O piesă din repertoriul celuilalt, reinventată.', simte: 'Respect' },
  { nr: '03', nume: 'Emotion', text: 'O baladă sau o piesă lentă, construită pe emoție.', simte: 'Emoție' },
  { nr: '04', nume: 'Roots', text: 'O piesă populară sau lăutărească, în stil propriu.', simte: 'Rădăcini' },
  { nr: '05', nume: 'Freestyle', text: 'Improvizație live pe beat-ul creat de DJ.', simte: 'Spontaneitate' },
  { nr: '06', nume: 'Power + Surprise', text: 'Energie maximă, alături de invitatul-surpriză.', simte: 'Explozie' },
];

// Continut static din pitch deck — nu are nevoie de DB (Sarcina B, IMPLEMENTARE-V3.md).
// Restilizat la redesign (Sarcina: extindere stil homepage pe /format).
export default function FormatPage() {
  return (
    <>
      <Header />

      <div className="format-banner">
        <div className="format-banner-inner">
          <span className="badge-eveniment">Format</span>
          <h1>The Battle of the Bands</h1>
          <p className="sub">Două identități muzicale. 12 provocări. O singură scenă.</p>
        </div>
      </div>

      <main>
        {/* Ideea centrala */}
        <section className="section-band panel-1">
          <div className="section-inner">
            <div className="section-label">
              <span>01 / Ideea centrală</span>
            </div>
            <div className="shead">
              <h2>12 ROUNDS transformă întâlnirea dintre doi artiști<br />într-un duel muzical ușor de urmărit.</h2>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: '60ch', margin: 0 }}>
              Construit pe aceleași șase provocări și pe răspunsuri complet diferite. Fără juriu. Fără
              eliminări. Fără învinși.
            </p>
            <div className="quote" style={{ marginBottom: 0 }}>
              <p>Diferența creează tensiunea. Muzica produce întâlnirea.</p>
            </div>
            <div className="formula-big">
              <div className="formula-big-piece">
                <div><strong>2</strong><span>Artiști</span></div>
                <i>×</i>
              </div>
              <div className="formula-big-piece">
                <div><strong>6</strong><span>Provocări fiecare</span></div>
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
            <p className="sub" style={{ marginTop: 24 }}>
              1 prezentator · 1 DJ · 2 invitați-surpriză · ≈85 de minute, fără pauză
              <br />
              Intro-ul și piesa comună de final sunt în afara celor 12 rounds.
            </p>
          </div>
        </section>

        {/* Cele sase provocari */}
        <section id="rounds" className="section-band">
          <div className="section-inner">
            <div className="section-label">
              <span>02 / Cele șase provocări</span>
              <span>Aceeași regulă. Două interpretări.</span>
            </div>
            <div className="shead">
              <h2>Aceeași regulă.<br /><span style={{ color: 'var(--muted)' }}>Două interpretări.</span></h2>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: '60ch', margin: '0 0 20px' }}>
              Fiecare artist răspunde la aceleași șase provocări. Ordinea construiește un crescendo, de la
              afirmarea identității până la explozie.
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

        {/* Momentul surpriza */}
        <section className="section-band panel-1">
          <div className="section-inner">
            <div className="section-label"><span>03 / Momentul-surpriză</span></div>
            <div className="shead">
              <h2>Round 11 și 12 schimbă miza</h2>
            </div>
            <div className="two-col" style={{ marginTop: 24 }}>
              <div className="two-col-card">
                <div className="kicker" style={{ marginBottom: 6 }}>Round 11</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', margin: '0 0 4px' }}>Artistul A</h3>
                <p className="sub" style={{ margin: 0, textAlign: 'left' }}>+ invitatul său surpriză</p>
              </div>
              <div className="two-col-card">
                <div className="kicker" style={{ marginBottom: 6 }}>Round 12</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', margin: '0 0 4px' }}>Artistul B</h3>
                <p className="sub" style={{ margin: 0, textAlign: 'left' }}>+ invitatul său surpriză</p>
              </div>
            </div>
          </div>
        </section>

        {/* Motorul scenei */}
        <section className="section-band">
          <div className="section-inner">
            <div className="section-label"><span>04 / Motorul scenei</span></div>
            <div className="shead">
              <h2>Un prezentator și un DJ<br /><span style={{ color: 'var(--muted)' }}>completează experiența</span></h2>
            </div>
            <div className="two-col" style={{ marginTop: 24 }}>
              <div className="two-col-card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, textTransform: 'uppercase', marginTop: 0, marginBottom: 12 }}>Prezentator</h3>
                <ol className="rolelist">
                  <li>Introduce artiștii și provocările</li>
                  <li>Construiește tensiunea artistică</li>
                  <li>Acoperă tranzițiile tehnice</li>
                  <li>Pregătește reveal-ul invitaților</li>
                  <li>Conduce show-ul spre final</li>
                </ol>
              </div>
              <div className="two-col-card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, textTransform: 'uppercase', marginTop: 0, marginBottom: 12 }}>DJ</h3>
                <ol className="rolelist">
                  <li>Creează intro-ul</li>
                  <li>Leagă sonor rundele</li>
                  <li>Produce beat-ul pentru freestyle</li>
                  <li>Menține pulsul între momente</li>
                  <li>Dă formatului o semnătură sonoră</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Grand Finale */}
        <section className="finale">
          <p className="eyebrow">05 / Grand Finale</p>
          <h2>12 rounds îi separă.<br /><span>Ultima piesă îi aduce împreună.</span></h2>
        </section>

        {/* Durata */}
        <section className="section-band panel-1">
          <div className="section-inner">
            <div className="section-label"><span>06 / Durata</span></div>
            <div className="shead">
              <h2>≈85 de minute, fără pauză</h2>
            </div>
            <div className="timeline" style={{ marginTop: 24 }}>
              <div><b>05</b><span>Intro DJ + prezentator</span></div>
              <div><b>42</b><span>Rounds 1–10</span></div>
              <div><b>12</b><span>Rounds 11–12 + invitați</span></div>
              <div><b>17–19</b><span>Prezentări, aplauze, tranziții</span></div>
              <div><b>07</b><span>Grand Finale + închidere</span></div>
            </div>
          </div>
        </section>

        {/* Banda finala */}
        <section className="section-band tight">
          <div className="section-inner">
            <div className="strip">
              <h2>Nu este încă un concert</h2>
              <p>Este întâlnirea pe care publicul nu o poate vedea nicăieri altundeva.</p>
              <Link className="btn" href="/">Vezi edițiile</Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
