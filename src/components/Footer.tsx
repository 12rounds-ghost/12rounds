import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-despre">
          <b>12 Rounds</b>
        </div>
        <div>
          <h5>Evenimente</h5>
          <Link href="/format">Despre format</Link>
          <Link href="/#viitoare">Calendar</Link>
          <Link href="/#trecute">Arhivă</Link>
        </div>
        <div>
          <h5>Legal</h5>
          <Link href="/termeni">Termeni și condiții</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
          <Link href="/rambursare">Politica de rambursare</Link>
          <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer">ANPC</a>
        </div>
      </div>
      <div className="site-footer-bot">
        <span>© {new Date().getFullYear()} 12 ROUNDS. Toate drepturile rezervate.</span>
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          Soluționarea online a litigiilor (SOL)
        </a>
      </div>
    </footer>
  );
}
