import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { trimiteEmailConfirmare } from '@/lib/email';

// Sarcina: fix cache Next.js (raspunsuri de status/date invechite in productie)
// — GET-urile fara acest export pot fi cache-uite la nivel de fetch si servi
// mereu primul raspuns calculat, indiferent cate ori se cere din nou.
export const dynamic = 'force-dynamic';

// Sarcina G (IMPLEMENTARE-V3.md): reincearca trimiterea emailului de
// confirmare pentru o dedicatie din filtrul "Emailuri nereusite".
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const mod = await obtineModeratorApi();
  if (!mod) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: ded } = await admin
    .from('dedicatii')
    .select('id, email, tip, pentru, de_la, mesaj')
    .eq('id', params.id)
    .maybeSingle();

  if (!ded) return NextResponse.json({ error: 'Dedicația nu a fost găsită.' }, { status: 404 });
  if (!ded.email) return NextResponse.json({ error: 'Dedicația nu are un email asociat.' }, { status: 400 });

  await trimiteEmailConfirmare({
    email: ded.email,
    dedicatieId: ded.id,
    tip: ded.tip,
    pentru: ded.pentru,
    deLa: ded.de_la,
    mesaj: ded.mesaj,
  });

  return NextResponse.json({ ok: true });
}
