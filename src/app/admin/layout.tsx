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
    { href: '/admin/dedicatii', eticheta: 'Dedicații' },
    { href: '/admin/statistici', eticheta: 'Statistici' },
  ],
  moderator: [
    { href: '/admin/moderare', eticheta: 'Moderare' },
    { href: '/admin/dedicatii', eticheta: 'Dedicații' },
  ],
  operator: [{ href: '/admin/regie', eticheta: 'Regie' }],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gata, setGata] = useState(false);
  const [linkuri, setLinkuri] = useState<{ href: string; eticheta: string }[]>([]);

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
      sb.from('moderatori')
        .select('rol')
        .eq('id', data.session!.user.id)
        .maybeSingle()
        .then(({ data: mod }) => {
          if (mod?.rol) setLinkuri(LINKURI_PE_ROL[mod.rol as RolModerator] ?? []);
        });
    });
  }, [pathname, router]);

  if (!gata) return null;

  return (
    <main className="container wide">
      <div className="brand">12 Rounds · Backstage</div>
      {pathname !== '/admin/login' && (
        <nav className="adminnav" style={{ marginTop: 12 }}>
          {linkuri.map((l) => (
            <Link key={l.href} href={l.href}>{l.eticheta}</Link>
          ))}
          <a
            href="/admin/login"
            onClick={async (e) => {
              e.preventDefault();
              await supabaseBrowser().auth.signOut();
              window.location.href = '/admin/login';
            }}
          >
            Ieșire
          </a>
        </nav>
      )}
      {children}
    </main>
  );
}
