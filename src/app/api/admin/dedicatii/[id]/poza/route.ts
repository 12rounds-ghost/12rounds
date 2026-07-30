import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Aprobarea textului NU aproba automat poza (Sarcina B, IMPLEMENTARE-V2.md)
// — sunt doua decizii separate. 'aproba' copiaza fisierul in bucket-ul
// public poze-aprobate (de-abia atunci ajunge vizibil in overlay) si sterge
// originalul din bucket-ul privat. 'exclude' doar sterge fisierul in
// asteptare — folosit fie la respingerea completa a dedicatiei, fie cand
// mesajul e bun dar poza nu e potrivita.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const mod = await obtineModeratorApi();
  if (!mod) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const { actiune } = await req.json();
  if (actiune !== 'aproba' && actiune !== 'exclude') {
    return NextResponse.json({ error: 'Acțiune invalidă.' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: ded } = await sb.from('dedicatii').select('poza_path').eq('id', params.id).maybeSingle();
  if (!ded || !ded.poza_path) {
    return NextResponse.json({ error: 'Dedicația nu are o poză în așteptare.' }, { status: 400 });
  }

  if (actiune === 'aproba') {
    const { data: fisier, error: eroareDescarcare } = await sb.storage
      .from('poze-in-verificare')
      .download(ded.poza_path);
    if (eroareDescarcare || !fisier) {
      return NextResponse.json({ error: 'Poza nu a putut fi citită.' }, { status: 500 });
    }
    const buffer = Buffer.from(await fisier.arrayBuffer());
    const { error: eroareUpload } = await sb.storage
      .from('poze-aprobate')
      .upload(ded.poza_path, buffer, { contentType: 'image/jpeg', upsert: true });
    if (eroareUpload) {
      return NextResponse.json({ error: 'Poza nu a putut fi publicată.' }, { status: 500 });
    }
    await sb.storage.from('poze-in-verificare').remove([ded.poza_path]);
    await sb.from('dedicatii').update({ poza_aprobata: true }).eq('id', params.id);
  } else {
    await sb.storage.from('poze-in-verificare').remove([ded.poza_path]);
    await sb.from('dedicatii').update({ poza_path: null, poza_aprobata: false }).eq('id', params.id);
  }

  return NextResponse.json({ ok: true });
}
