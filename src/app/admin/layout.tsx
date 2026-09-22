'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { RolModerator } from '@/lib/auth-admin';

// Navigarea de mai jos e doar comoditate vizuala — ascunderea unui link NU e
// o restrictie de acces. Verificarea reala se face server-side, in fiecare
// pagina (cereRol, src/lib/auth-admin.ts).
const LINKURI_PE_ROL: Record<RolModerator, { href: string; eticheta: string }[]> = {
  admin: [
    { href: '/admin', eticheta: 'Dashboard' },
    { href: '/admin/moderare', eticheta: 'Moderare' },
    { href: '/admin/regie', eticheta: 'Regie' },
    { href: '/admin/ecrane', eticheta: 'Ecrane' },
    { href: '/admin/dedicatii', eticheta: 'Dedicații' },
    { href: '/admin/sponsori', eticheta: 'Sponsori' },
    { href: '/admin/statistici', eticheta: 'Statistici' },
    { href: '/admin/setari', eticheta: 'Setări' },
  ],
  moderator: [
    { href: '/admin/moderare', eticheta: 'Moderare' },
    { href: '/admin/dedicatii', eticheta: 'Dedicații' },
  ],
  operator: [{ href: '/admin/regie', eticheta: 'Regie' }],
};

const DATA_AZI = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gata, setGata] = useState(false);
  const [linkuri, setLinkuri] = useState<{ href: string; eticheta: string }[]>([]);
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolModerator | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setGata(true);
      return;
    }
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      setGata(true);
      setEmail(data.session.user.email ?? '');
      sb.from('moderatori')
        .select('rol')
        .eq('id', data.session!.user.id)
        .maybeSingle()
        .then(({ data: mod }) => {
          if (mod?.rol) {
            setRol(mod.rol as RolModerator);
            setLinkuri(LINKURI_PE_ROL[mod.rol as RolModerator] ?? []);
          }
        });
    });
  }, [pathname, router]);

  if (!gata) return null;

  // /admin/login e o pagina de autentificare de sine statatoare — nu face
  // parte din interfata de operare (fara sidebar/breadcrumb).
  if (pathname === '/admin/login') {
    return <main className="container wide">{children}</main>;
  }

  async function iesire() {
    await supabaseBrowser().auth.signOut();
    window.location.href = '/admin/login';
  }

  const eticheta = linkuri.find((l) => pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href)))?.eticheta;

  return (
    <div className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-sidebar-brand">
          <img src="/logo.jpeg" alt="" />
          <span>
            12 ROUNDS
            <small>The Battle of the Bands</small>
          </span>
        </div>

        <p className="ops-nav-label">Show operations</p>
        <nav className="ops-nav">
          {linkuri.map((l) => {
            const activ = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href} className={activ ? 'activ' : ''}>
                {l.eticheta}
              </Link>
            );
          })}
        </nav>

        <div className="ops-sidebar-footer">
          <div className="ops-user-block">
            <span>{(email || '?')[0].toUpperCase()}</span>
            <div>
              <b>{email || 'Cont'}</b>
              <small>{rol?.toUpperCase() ?? ''}</small>
            </div>
          </div>
          <a href="/admin/login" onClick={(e) => { e.preventDefault(); iesire(); }}>
            Ieșire
          </a>
        </div>
      </aside>

      <div className="ops-content">
        <header className="ops-header">
          <div className="ops-breadcrumb">
            <span>12 Rounds</span>
            <span>›</span>
            <span>{eticheta ?? 'Admin'}</span>
          </div>
          <span className="ops-top-date">{DATA_AZI}</span>
        </header>
        <main className="ops-main">{children}</main>
      </div>
    </div>
  );
}
