import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Creator League — 12 ROUNDS' };

// Pagina spre care trimite butonul "Devino creator" din sectiunea Creator
// League de pe homepage (Sarcina: redesign homepage). Momentan doar
// informativa/de contact — nu exista inca un portal de creatori sau un flux
// de inscriere in aplicatie, deci nu inventam unul; doar nu lasam linkul rupt.
export default function CreatorLeaguePage() {
  return (
    <>
      <Header />
      <main className="container wide">
        <section style={{ marginTop: 40, maxWidth: 640 }}>
          <div className="section-label"><span>Creator league</span></div>
          <h1 style={{ textAlign: 'left', fontSize: 'clamp(30px, 5vw, 44px)' }}>
            Devino creator 12 ROUNDS
          </h1>
          <p className="sub" style={{ textAlign: 'left', fontSize: 16, margin: '16px 0' }}>
            Creatorii sunt parteneri de distribuție. Recompensa lor reflectă valoarea verificabilă
            creată: audiență, trafic, fani, vânzări și conținut care merge mai departe.
          </p>
          <p className="sub" style={{ textAlign: 'left' }}>
            Portalul de creatori e în pregătire. Până atunci, scrie-ne direct și te contactăm cu
            detalii despre program și colaborare.
          </p>
          <a className="btn" style={{ width: 'auto', display: 'inline-block' }} href="mailto:contact@12rounds.ro">
            Scrie-ne
          </a>
        </section>
        <Footer />
      </main>
    </>
  );
}
