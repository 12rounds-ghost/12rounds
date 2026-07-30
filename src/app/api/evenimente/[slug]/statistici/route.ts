import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculeazaStatisticiPublice } from '@/lib/statistici-publice';

// Statistici publice pentru un eveniment — doar agregate (Sarcina C,
// IMPLEMENTARE-V2.md). Pagina /eveniment/[slug] calculeaza direct prin
// calculeazaStatisticiPublice() (e un Server Component, n-are rost sa se
// auto-cheme prin fetch); ruta ramane pentru orice consum extern/direct.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const sb = supabaseAdmin();
  const { data: event } = await sb.from('events').select('id').eq('slug', params.slug).maybeSingle();
  if (!event) {
    return NextResponse.json({ error: 'Evenimentul nu a fost găsit.' }, { status: 404 });
  }
  const statistici = await calculeazaStatisticiPublice(event.id);
  return NextResponse.json(statistici);
}
