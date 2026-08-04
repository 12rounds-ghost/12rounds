import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Formatul — 12 ROUNDS' };

// Continut static din pitch deck — nu are nevoie de DB (Sarcina B, IMPLEMENTARE-V3.md).
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

      <main className="container wide">
        {/* Ideea centrala */}
        <section className="shead" style={{ marginTop: 40 }}>
          <div>
            <div className="kicker">Ideea centrală</div>
            <h2>Nu este un concert dublu.<br />Este un show cu mecanism.</h2>
          </div>
          <p>
            12 ROUNDS transformă întâlnirea dintre doi artiști într-un duel artistic ușor de urmărit,
            construit pe aceleași șase provocări și pe răspunsuri complet diferite. Fără juriu. Fără
            eliminări. Fără învinși.
          </p>
        </section>
        <div className="quote" style={{ marginTop: 0, marginBottom: 28 }}>
          <p>Diferența creează tensiunea. Muzica produce întâlnirea.</p>
        </div>
        <div className="formula">
          <div><b>2</b><span>Artiști</span></div>
          <div><b>×6</b><span>Provocări fiecare</span></div>
          <div><b>12</b><span>Rounds</span></div>
          <div><b>+1</b><span>Grand Finale</span></div>
        </div>
        <p className="sub" style={{ marginTop: 16 }}>
          1 prezentator · 1 DJ · 2 invitați-surpriză · ≈85 de minute, fără pauză
          <br />
          Intro-ul și piesa comună de final sunt în afara celor 12 rounds.
        </p>

        {/* Cele sase provocari */}
        <section className="shead" style={{ marginTop: 48 }}>
          <div>
            <div className="kicker">Cele șase provocări</div>
            <h2>Aceeași regulă.<br />Două interpretări.</h2>
          </div>
          <p>Fiecare artist răspunde la aceleași șase provocări. Ordinea construiește un crescendo, de la afirmarea identității până la explozie.</p>
        </section>
        <div className="chal">
          <article><div className="n">01</div><h3>Signature</h3><p>O piesă proprie care definește artistul.</p><div className="arc">Identitate</div></article>
          <article><div className="n">02</div><h3>Exchange</h3><p>O piesă din repertoriul celuilalt, reinventată.</p><div className="arc">Respect</div></article>
          <article><div className="n">03</div><h3>Emotion</h3><p>O baladă sau o piesă lentă, construită pe emoție.</p><div className="arc">Emoție</div></article>
          <article><div className="n">04</div><h3>Roots</h3><p>O piesă populară sau lăutărească, în stil propriu.</p><div className="arc">Rădăcini</div></article>
          <article><div className="n">05</div><h3>Freestyle</h3><p>Improvizație live pe beat-ul creat de DJ.</p><div className="arc">Spontaneitate</div></article>
          <article><div className="n">06</div><h3>Power + Surprise</h3><p>Energie maximă, alături de invitatul-surpriză.</p><div className="arc">Explozie</div></article>
        </div>

        {/* Momentul surpriza */}
        <section className="shead" style={{ marginTop: 48 }}>
          <div>
            <div className="kicker">Momentul-surpriză</div>
            <h2>Round 11 și 12 schimbă miza</h2>
          </div>
          <p>Invitatul apare în cea de-a șasea piesă a artistului. Nu adaugă o piesă suplimentară. Secret pentru public, planificat și repetat de producție.</p>
        </section>
        <div className="two-col">
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

        {/* Motorul scenei */}
        <section className="shead" style={{ marginTop: 48 }}>
          <div>
            <div className="kicker">Motorul scenei</div>
            <h2>Un prezentator și un DJ<br />mențin ritmul viu</h2>
          </div>
          <p>Intervenții scurte. Tranziții controlate. O singură identitate de show.</p>
        </section>
        <div className="two-col">
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

        {/* Grand Finale + Durata */}
        <section className="shead" style={{ marginTop: 48 }}>
          <div>
            <div className="kicker">Grand Finale</div>
            <h2>12 rounds îi separă.<br />Ultima piesă îi aduce împreună.</h2>
          </div>
          <p>Duet · Mash-up · Piesă creată special pentru ediție. Din confruntare se naște colaborarea.</p>
        </section>
        <section className="shead" style={{ marginTop: 34 }}>
          <div>
            <div className="kicker">Durata</div>
            <h2>≈85 de minute, fără pauză</h2>
          </div>
        </section>
        <div className="timeline">
          <div><b>05</b><span>Intro DJ + prezentator</span></div>
          <div><b>42</b><span>Rounds 1–10</span></div>
          <div><b>12</b><span>Rounds 11–12 + invitați</span></div>
          <div><b>17–19</b><span>Prezentări, aplauze, tranziții</span></div>
          <div><b>07</b><span>Grand Finale + închidere</span></div>
        </div>
        <p className="sub" style={{ marginTop: 12 }}>
          Slot operațional rezervat: 90 de minute. Condiție de ritm: backline comun sau două setup-uri pre-patched.
        </p>

        {/* De ce functioneaza */}
        <section className="shead" style={{ marginTop: 48 }}>
          <div>
            <div className="kicker">De ce funcționează</div>
            <h2>Valoare pentru întregul ecosistem</h2>
          </div>
        </section>
        <div className="grid3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="two-col-card" style={{ padding: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, textTransform: 'uppercase', margin: '0 0 6px' }}>Public</h3>
            <p className="sub" style={{ margin: 0, textAlign: 'left', fontSize: 13.5 }}>Întâlniri muzicale și apariții-surpriză care nu există într-un concert obișnuit.</p>
          </div>
          <div className="two-col-card" style={{ padding: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, textTransform: 'uppercase', margin: '0 0 6px' }}>Artiști</h3>
            <p className="sub" style={{ margin: 0, textAlign: 'left', fontSize: 13.5 }}>Versatilitate, acces la publicul celuilalt artist și conținut original.</p>
          </div>
          <div className="two-col-card" style={{ padding: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, textTransform: 'uppercase', margin: '0 0 6px' }}>Parteneri</h3>
            <p className="sub" style={{ margin: 0, textAlign: 'left', fontSize: 13.5 }}>Inventar de comunicare înainte, în timpul și după show.</p>
          </div>
          <div className="two-col-card" style={{ padding: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, textTransform: 'uppercase', margin: '0 0 6px' }}>Media & Organizatori</h3>
            <p className="sub" style={{ margin: 0, textAlign: 'left', fontSize: 13.5 }}>Durată predictibilă, mecanism repetabil, adaptare pentru orașe și festivaluri.</p>
          </div>
        </div>
        <div className="tier-label">Scalabilitate</div>
        <div className="sponsors" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="sponsor-item" style={{ borderStyle: 'solid' }}><span>City Edition</span></div>
          <div className="sponsor-item" style={{ borderStyle: 'solid' }}><span>Festival Special</span></div>
          <div className="sponsor-item" style={{ borderStyle: 'solid' }}><span>TV / Streaming</span></div>
          <div className="sponsor-item" style={{ borderStyle: 'solid' }}><span>Serie / Franciză</span></div>
        </div>

        {/* Banda finala */}
        <section style={{ marginTop: 48 }}>
          <div className="strip">
            <h2>Nu este încă un concert</h2>
            <p>Este întâlnirea pe care publicul nu o poate vedea nicăieri altundeva.</p>
            <Link className="btn" href="/">Vezi edițiile</Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
