import Link from 'next/link';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Termeni și condiții — 12 ROUNDS' };

export default function Termeni() {
  return (
    <main className="container">
      <div className="brand">12 Rounds</div>
      <h1>Termeni și condiții</h1>
      <p className="sub">Ultima actualizare: [DE COMPLETAT — data publicării]</p>

      <div className="card legal">
        <h2>1. Operatorul serviciului</h2>
        <p>
          Serviciul „12 ROUNDS — Dedicații" (12rounds.ro) este operat de{' '}
          <strong>[DE COMPLETAT — denumire firmă]</strong>, CUI{' '}
          <strong>[DE COMPLETAT]</strong>, cu sediul în{' '}
          <strong>[DE COMPLETAT — adresă sediu social]</strong>, contact:{' '}
          <strong>[DE COMPLETAT — email/telefon]</strong>.
        </p>

        <h2>2. Ce oferă serviciul</h2>
        <p>
          Platforma permite achiziționarea de dedicații („Susține show-ul", „Dedicație pe
          ecran", „Dedicație citită de prezentator") care sunt afișate pe ecranele din sală
          și în transmisiunile live ale evenimentului 12 ROUNDS — The Battle of the Bands,
          după aprobarea unui moderator al echipei.
        </p>

        <h2>3. Prețuri</h2>
        <p>
          Prețurile pachetelor sunt afișate în lei (RON) înainte de plată și pot fi
          modificate de organizator între ediții. Prețul afișat la momentul plății este
          cel aplicat comenzii respective.
        </p>

        <h2>4. Plata</h2>
        <p>
          Plata se procesează integral prin Stripe (card bancar, Apple Pay, Google Pay).
          Nu stocăm și nu avem acces la datele cardului tău.
        </p>

        <h2>5. Moderare</h2>
        <p>
          Fiecare dedicație trece printr-o verificare umană înainte de a fi difuzată.
          Organizatorul își rezervă dreptul de a respinge mesaje care încalcă regulile
          show-ului (limbaj nepotrivit, conținut ilegal, discriminatoriu sau ofensator).
          Mesajele respinse sunt rambursate — vezi{' '}
          <Link href="/rambursare">Politica de rambursare</Link>.
        </p>

        <h2>6. Disponibilitatea show-ului</h2>
        <p>
          Dedicațiile pot fi achiziționate doar cât timp o ediție este marcată „live”.
          Pentru edițiile viitoare anunțate, poți rezerva o dedicație din timp.
        </p>

        <h2>7. Limitarea răspunderii</h2>
        <p>
          Organizatorul nu răspunde pentru întreruperi tehnice (conexiune, curent,
          platforme de streaming terțe) care pot afecta afișarea sau transmisiunea unei
          dedicații. În aceste cazuri se aplică Politica de rambursare.
        </p>

        <h2>8. Legea aplicabilă</h2>
        <p>Acești termeni sunt guvernați de legislația română.</p>

        <h2>9. Contact</h2>
        <p>[DE COMPLETAT — adresă de email pentru întrebări și reclamații]</p>
      </div>

      <Footer />
    </main>
  );
}
