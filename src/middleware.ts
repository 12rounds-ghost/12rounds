import { NextResponse, type NextRequest } from 'next/server';

// Site "revenim in curand": tot domeniul e blocat cu o parola pana la
// lansare, ca sa se poata lucra pe 12rounds.ro fara sa fie public inca.
// Stripe trebuie sa poata ajunge oricand la /api/webhook, indiferent de gate.
// /.well-known e pentru fisierul de verificare a domeniului pentru Apple Pay.
// /ecran si /api/ecran raman libere de gate-ul "revenim in curand" — kiosk-urile
// din sala nu au niciodata cookie-ul de acces, dar sunt oricum protejate separat
// de ECRAN_SECRET (Sarcina F). La fel /overlay si /api/overlay — OBS/vMix
// e un Browser Source fara cookie, protejat separat de OVERLAY_SECRET.
const CALE_LIBERA = [
  '/coming-soon',
  '/api/site-access',
  '/api/webhook',
  '/.well-known',
  '/ecran',
  '/api/ecran',
  '/overlay',
  '/api/overlay',
];

const COOKIE = '12rounds_access';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (CALE_LIBERA.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const acces = req.cookies.get(COOKIE)?.value;
  if (acces && acces === process.env.SITE_ACCESS_TOKEN) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpeg).*)'],
};
