import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Sarcina: buton "retrimite pe ecran" din admin. Cu ecranele sincronizate
// (0025/0026) ce se afiseaza urmator nu mai e ales dupa status_difuzare, ci
// strict dupa nr_difuzari — vechiul buton reseta status_difuzare fara efect.
// Aici doar marcam dedicatia cu redifuzare_fortata; avanseaza_ecrane_sala o
// alege la urmatoarea sa avansare (cel mult durata_afisare_secunde), inaintea
// cozii normale, indiferent cate difuzari are deja.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const mod = await obtineModeratorApi();
  if (!mod) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  if (mod.rol !== 'admin' && mod.rol !== 'moderator') {
    return NextResponse.json({ error: 'Fără drepturi' }, { status: 403 });
  }

  const admin = supabaseAdmin();
  const { data: ded } = await admin
    .from('dedicatii')
    .select('id, tip, status_plata, status_moderare')
    .eq('id', params.id)
    .maybeSingle();

  if (!ded) return NextResponse.json({ error: 'Dedicația nu a fost găsită.' }, { status: 404 });
  if (ded.tip !== 'ecran') {
    return NextResponse.json({ error: 'Doar dedicațiile pentru ecranele din sală pot fi retrimise.' }, { status: 400 });
  }
  if (ded.status_plata !== 'paid' || ded.status_moderare !== 'aprobat') {
    return NextResponse.json({ error: 'Dedicația trebuie să fie plătită și aprobată.' }, { status: 400 });
  }

  const { error } = await admin.from('dedicatii').update({ redifuzare_fortata: true }).eq('id', params.id);
  if (error) {
    console.error('Nu am putut marca redifuzarea fortata', error);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
