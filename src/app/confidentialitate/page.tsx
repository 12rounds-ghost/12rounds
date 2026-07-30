import { Footer } from '@/components/Footer';

export const metadata = { title: 'Confidențialitate — 12 ROUNDS' };

export default function Confidentialitate() {
  return (
    <main className="container">
      <div className="brand">12 Rounds</div>
      <h1>Politica de confidențialitate</h1>
      <p className="sub">Ultima actualizare: [DE COMPLETAT — data publicării]</p>

      <div className="card legal">
        <h2>1. Operatorul de date</h2>
        <p>
          Datele tale sunt prelucrate de <strong>[DE COMPLETAT — denumire firmă]</strong>,
          CUI <strong>[DE COMPLETAT]</strong>, cu sediul în{' '}
          <strong>[DE COMPLETAT — adresă sediu social]</strong>, contact:{' '}
          <strong>[DE COMPLETAT — email/telefon]</strong>.
        </p>

        <h2>2. Ce date colectăm</h2>
        <p>
          Când trimiți o dedicație, colectăm: numele „de la” și „pentru” (dacă le
          completezi), mesajul, artistul preferat (opțional), platforma de unde ai venit
          (ex. qr, tiktok), o poză atașată (opțional, doar pentru pachetele cu mesaj) și,
          la plată, adresa de email pe care o introduci în Stripe Checkout. Nu colectăm și
          nu stocăm niciodată datele cardului bancar — acestea rămân integral în sistemele
          Stripe.
        </p>
        <p>
          Poza atașată este vizibilă doar echipei, până la aprobarea sau respingerea ei de
          către un moderator. Devine public vizibilă (pe ecranele din sală și în
          transmisiune) doar dacă e aprobată explicit — aprobarea mesajului nu aprobă
          automat și poza.
        </p>

        <h2>3. Scopul prelucrării</h2>
        <p>
          Folosim aceste date pentru: procesarea plății, afișarea dedicației pe ecran și
          în transmisiune, trimiterea unui email de confirmare cu linkul de status și, dacă
          e cazul, pentru a efectua o rambursare.
        </p>

        <h2>4. Temeiul legal</h2>
        <p>Executarea contractului (art. 6 alin. 1 lit. b GDPR) — ne trimiți datele ca să livrăm serviciul comandat.</p>

        <h2>5. Cui transmitem datele</h2>
        <p>
          Folosim următorii furnizori (împuterniciți), care procesează date strict pentru
          noi:
        </p>
        <ul>
          <li><strong>Stripe</strong> — procesarea plăților</li>
          <li><strong>Supabase</strong> — găzduirea bazei de date</li>
          <li><strong>Resend</strong> — trimiterea emailului de confirmare</li>
        </ul>

        <h2>6. Perioada de stocare</h2>
        <p>[DE COMPLETAT — cât timp păstrați datele dedicațiilor după eveniment]</p>
        <p>
          Pozele atașate dedicațiilor sunt păstrate <strong>maximum 90 de zile</strong> de la
          data evenimentului, după care sunt șterse automat din sistemele noastre. Pozele
          urcate dar neasociate unei plăți finalizate sunt șterse automat în cel mult 48 de
          ore. Poți solicita oricând ștergerea mai devreme a pozei tale — vezi secțiunea 7.
        </p>

        <h2>7. Drepturile tale</h2>
        <p>
          Conform GDPR, ai dreptul de acces, rectificare, ștergere, restricționare și
          opoziție asupra datelor tale, precum și dreptul de a depune plângere la{' '}
          <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">
            ANSPDCP
          </a>
          . Acest drept include și ștergerea, la cerere, a unei poze atașate unei dedicații,
          înainte de expirarea perioadei standard de retenție. Pentru a-ți exercita
          drepturile, scrie-ne la: [DE COMPLETAT — email contact].
        </p>
      </div>

      <Footer />
    </main>
  );
}
