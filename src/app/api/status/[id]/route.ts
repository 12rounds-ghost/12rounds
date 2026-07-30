import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Singurul loc de unde clientul (anon) poate afla statusul unei dedicatii.
// Foloseste service role (ocoleste RLS) dar returneaza doar campurile necesare
// paginii de status — niciodata stripe_* sau suma_bani.
const CAMPURI_PUBLICE =
  'id, tip, pentru, de_la, status_plata, status_moderare, status_difuzare, motiv_respingere, event_id, sursa_platforma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('dedicatii')
    .select(CAMPURI_PUBLICE)
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    console.error('status api error', error);
    return NextResponse.json({ error: 'A apărut o eroare.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Dedicația nu a fost găsită.' }, { status: 404 });
  }

  return NextResponse.json(data);
}
