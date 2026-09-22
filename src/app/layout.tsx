import type { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import './globals.css';

// Sarcina: redesign homepage — Barlow Condensed inlocuieste Anton ca font de
// afisaj peste tot in aplicatie (nu doar homepage — vezi globals.css, unde
// --font-display e folosit sitewide: header, admin, checkout). latin-ext e
// obligatoriu, altfel diacriticele (ă â î ș ț) cad pe fallback.
const barlow = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '12 ROUNDS — Dedicații',
  description:
    'Trimite o dedicație în timpul show-ului 12 ROUNDS. Fără cont, fără aplicație.',
  icons: { icon: '/logo.jpeg' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Setat din /admin/setari. supabaseAdmin() (nu supabaseServer()) —
  // supabaseServer() citeste cookies(), ceea ce ar forta tot layout-ul (deci
  // si paginile statice: Termeni, Confidentialitate) sa devina dinamic.
  // Datele sunt oricum publice (RLS: setari_site_citire_publica), deci
  // ocolirea RLS aici nu schimba ce se poate vedea.
  const { data: setari } = await supabaseAdmin()
    .from('setari_site')
    .select('google_tag_id')
    .eq('id', 1)
    .maybeSingle();

  return (
    <html lang="ro" className={barlow.variable}>
      <body>
        {children}
        <GoogleAnalytics tagId={setari?.google_tag_id ?? ''} />
      </body>
    </html>
  );
}
