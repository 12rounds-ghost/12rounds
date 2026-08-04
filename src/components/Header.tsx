import Link from 'next/link';
import Image from 'next/image';

// Nav public, sticky — Sarcina A. Nu apare in /admin (are propriul header,
// vezi src/app/admin/layout.tsx) sau in /coming-soon.
export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-logo">
          <Image src="/logo.jpeg" alt="" width={40} height={40} />
          <b>12 Rounds</b>
        </Link>
        <nav className="site-header-nav">
          <Link href="/format">Formatul</Link>
          <Link href="/#viitoare">Evenimente</Link>
          <Link href="/#trecute">Arhivă</Link>
          <Link href="/#sponsori">Parteneri</Link>
        </nav>
        <Link href="/live" className="site-header-cta">Trimite o dedicație</Link>
      </div>
    </header>
  );
}
