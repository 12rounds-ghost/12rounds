import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '12 ROUNDS — Dedicații',
  description:
    'Trimite o dedicație în timpul show-ului 12 ROUNDS. Fără cont, fără aplicație.',
  icons: { icon: '/logo.jpeg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
