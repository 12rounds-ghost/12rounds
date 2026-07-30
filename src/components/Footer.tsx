import Link from 'next/link';
import { LinkDedicatiileMele } from '@/components/LinkDedicatiileMele';

export function Footer() {
  return (
    <footer className="site-footer">
      <LinkDedicatiileMele />
      <nav className="site-footer-linkuri">
        <Link href="/termeni">Termeni și condiții</Link>
        <Link href="/confidentialitate">Confidențialitate</Link>
        <Link href="/rambursare">Politica de rambursare</Link>
      </nav>
      <p className="site-footer-extern">
        <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer">ANPC</a>
        {' · '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          Soluționarea online a litigiilor (SOL)
        </a>
      </p>
    </footer>
  );
}
