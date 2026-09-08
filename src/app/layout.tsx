import type { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={barlow.variable}>
      <body>{children}</body>
    </html>
  );
}
