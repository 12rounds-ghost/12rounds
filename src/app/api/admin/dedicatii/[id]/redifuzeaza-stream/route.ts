import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Sarcina: buton "retrimite pe stream" din admin — util la testare, ca sa nu
// mai trebuiasca creata mereu o dedicatie noua ca sa vezi ceva pe overlay-ul
// de live.
//
// Doar tip='stream' — o dedicatie "din sala" (tip='ecran') merge mereu si pe
// live (0021), deci retrimiterea ei se face din butonul "Arata din nou pe
// ecran" (redifuzeaza-ecran/route.ts), care seteaza AMBELE flag-uri dintr-un
// singur click. Aici ramane doar cazul care n-are alta cale: o dedicatie
// 'stream' nu apare niciodata pe ecrane, deci nu are unde altundeva sa fie
// retrimisa.
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
  if (ded.tip !== 'stream') {
    return NextResponse.json(
      { error: 'Doar dedicațiile pentru transmisiunea live pot fi retrimise de aici — cele de pe ecran se retrimit din „Arată din nou pe ecran".' },
      { status: 400 }
    );
  }
  if (ded.status_plata !== 'paid' || ded.status_moderare !== 'aprobat') {
    return NextResponse.json({ error: 'Dedicația trebuie să fie plătită și aprobată.' }, { status: 400 });
  }

  const { error } = await admin.from('dedicatii').update({ redifuzare_fortata_stream: true }).eq('id', params.id);
  if (error) {
    console.error('Nu am putut marca redifuzarea fortata pe stream', error);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
