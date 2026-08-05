import { NextResponse } from 'next/server';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

const COOKIE = '12rounds_access';

// Deblocheaza site-ul "revenim in curand" (vezi src/middleware.ts). Parola
// e comparata server-side; cookie-ul primit de client nu e parola in sine,
// ci un token separat (SITE_ACCESS_TOKEN), ca sa nu circule parola reala.
export async function POST(req: Request) {
  const { password } = await req.json();

  if (typeof password !== 'string' || password !== process.env.SITE_ACCESS_PASSWORD) {
    return NextResponse.json({ error: 'Parolă greșită.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, process.env.SITE_ACCESS_TOKEN ?? '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
