import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

const DOUA_ZILE_MS = 48 * 60 * 60 * 1000;

// Sarcina B (IMPLEMENTARE-V2.md): sterge din poze-in-verificare fisierele mai
// vechi de 48h care nu sunt legate de o dedicatie platita — checkout-uri
// abandonate dupa ce clientul a urcat o poza dar n-a mai platit.
export async function POST() {
  const mod = await obtineModeratorApi();
  if (!mod || mod.rol !== 'admin') {
    return NextResponse.json({ error: 'Fără drepturi.' }, { status: 403 });
  }

  const sb = supabaseAdmin();
  const { data: fisiere, error } = await sb.storage.from('poze-in-verificare').list('', { limit: 1000 });
  if (error) {
    return NextResponse.json({ error: 'Nu am putut lista pozele.' }, { status: 500 });
  }

  const acum = Date.now();
  const candidati = (fisiere ?? []).filter((f) => {
    const creat = f.created_at ? new Date(f.created_at).getTime() : 0;
    return acum - creat > DOUA_ZILE_MS;
  });

  if (candidati.length === 0) {
    return NextResponse.json({ sterse: 0 });
  }

  const { data: dedicatiiPlatite } = await sb
    .from('dedicatii')
    .select('poza_path')
    .eq('status_plata', 'paid')
    .in('poza_path', candidati.map((f) => f.name));

  const legate = new Set((dedicatiiPlatite ?? []).map((d) => d.poza_path));
  const deSters = candidati.filter((f) => !legate.has(f.name)).map((f) => f.name);

  if (deSters.length > 0) {
    await sb.storage.from('poze-in-verificare').remove(deSters);
  }

  return NextResponse.json({ sterse: deSters.length });
}
