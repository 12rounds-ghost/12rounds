import Link from 'next/link';
import Image from 'next/image';
import { SocialLinks } from '@/components/SocialLinks';

// Nav public, sticky — Sarcina A, actualizat la redesign homepage: ancore
// spre noile sectiuni (#concept, #rounds, #live = Beyond the Stage,
// #creators), plus paginile reale existente (/format, /#viitoare pt.
// calendar, /#sponsori). Nu apare in /admin (are propriul header, vezi
// src/app/admin/layout.tsx) sau in /coming-soon. Fara login/creeaza-cont —
// aplicatia noastra nu are cont de spectator, nu era nimic de sters aici.
export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-logo">
          <Image src="/logo.jpeg" alt="" width={55} height={55} />
          <span>
            <b>12 Rounds</b>
            <small>The Battle of the Bands</small>
          </span>
        </Link>
        <nav className="site-header-nav">
          <Link href="/#concept">Concept</Link>
          <Link href="/#rounds">12 Rounds</Link>
          <Link href="/#viitoare">Ediții</Link>
          <Link href="/#creators">Creators</Link>
          <Link href="/#live">Live</Link>
          <Link href="/format">Formatul</Link>
        </nav>
        <SocialLinks />
        <Link href="/live" className="site-header-cta">Trimite o dedicație</Link>
      </div>
    </header>
  );
}
