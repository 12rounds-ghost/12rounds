import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Politica de rambursare — 12 ROUNDS' };

export default function Rambursare() {
  return (
    <>
      <Header />
      <main className="container">
      <div className="brand">12 Rounds</div>
      <h1>Politica de rambursare</h1>
      <p className="sub">Ultima actualizare: [DE COMPLETAT — data publicării]</p>

      <div className="card legal">
        <h2>Când primești banii înapoi</h2>
        <p>Rambursăm integral plata ta în următoarele situații:</p>
        <ul>
          <li>
            <strong>Mesajul este respins la moderare.</strong> Dacă dedicația ta nu
            respectă regulile show-ului (limbaj nepotrivit, conținut ilegal sau
            discriminatoriu), moderatorul o respinge și plata este rambursată automat.
          </li>
          <li>
            <strong>O dedicație garantată nu poate fi difuzată.</strong> Pentru pachetele
            „Dedicație pe ecran” și „Dedicație citită de prezentator”, dacă din motive
            organizatorice sau tehnice mesajul aprobat nu ajunge să fie difuzat în timpul
            show-ului, rambursăm plata.
          </li>
        </ul>

        <h2>Ce nu se rambursează</h2>
        <p>
          O dedicație deja difuzată (apărută pe ecranele din sală) sau aflată încă în
          așteptare, aprobată, în timp ce show-ul este live, nu este eligibilă pentru
          rambursare — serviciul a fost sau urmează să fie livrat conform planificării
          show-ului.
        </p>

        <h2>Cum se face rambursarea</h2>
        <p>
          Rambursarea se procesează prin Stripe, pe același card folosit la plată, și
          apare de obicei în [DE COMPLETAT — ex. 5-10 zile lucrătoare], în funcție de banca
          emitentă a cardului. Vei vedea statusul „Plata a fost rambursată” pe pagina de
          status a dedicației tale.
        </p>

        <h2>Întrebări</h2>
        <p>
          Pentru orice nelămurire legată de o rambursare, scrie-ne la:{' '}
          [DE COMPLETAT — email contact].
        </p>
      </div>

      <Footer />
      </main>
    </>
  );
}
