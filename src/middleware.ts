import { NextResponse, type NextRequest } from 'next/server';

// Site "revenim in curand": tot domeniul e blocat cu o parola pana la
// lansare, ca sa se poata lucra pe 12rounds.ro fara sa fie public inca.
// Stripe trebuie sa poata ajunge oricand la /api/webhook, indiferent de gate.
// /.well-known e pentru fisierul de verificare a domeniului pentru Apple Pay.
// /ecran si /api/ecran raman libere de gate-ul "revenim in curand" — kiosk-urile
// din sala nu au niciodata cookie-ul de acces, dar sunt oricum protejate separat
// de ECRAN_SECRET (Sarcina F). La fel /overlay si /api/overlay — OBS/vMix
// e un Browser Source fara cookie, protejat separat de OVERLAY_SECRET.
// /rounds-kit e playerul de animatii (fisiere statice din public/), incarcat
// intr-un iframe chiar din /ecran si /overlay — daca ar ramane in spatele
// gate-ului, iframe-ul ar arata "revenim in curand" pe un kiosk real, care
// nu are niciodata cookie-ul de acces.
const CALE_LIBERA = [
  '/coming-soon',
  '/api/site-access',
  '/api/webhook',
  '/.well-known',
  '/ecran',
  '/api/ecran',
  '/overlay',
  '/api/overlay',
  '/rounds-kit',
];

const COOKIE = '12rounds_access';

// Sarcina: comutator din admin pentru gate-ul de mai sus (/admin/setari) —
// pana acum singura cale sa scoti "revenim in curand" era o variabila de
// mediu, care cere redeploy. Acum admin-ul citeste/scrie direct in
// setari_site.site_public (migratia 0029); cand e true, tot site-ul e liber,
// indiferent de cookie.
//
// Cache de 15s (next.revalidate) — altfel am interoga Supabase la fiecare
// cerere din tot site-ul, ceea ce ar adauga o latenta si o incarcare inutile.
// Inseamna ca un comutator din admin ajunge la vizitatori in cel mult 15
// secunde, nu instant — acceptabil pentru o schimbare rara. Daca citirea
// esueaza (Supabase indisponibil etc.), ramanem pe gate-ul cu parola
// (fail-closed) — o eroare de retea nu trebuie sa lase site-ul public din
// greseala.
async function esteSitePublic(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cheie = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cheie) return false;
  try {
    const res = await fetch(`${url}/rest/v1/setari_site?id=eq.1&select=site_public`, {
      headers: { apikey: cheie, Authorization: `Bearer ${cheie}` },
      next: { revalidate: 15 },
    });
    if (!res.ok) return false;
    const randuri = (await res.json()) as { site_public?: boolean }[];
    return randuri[0]?.site_public === true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (CALE_LIBERA.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (await esteSitePublic()) {
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
