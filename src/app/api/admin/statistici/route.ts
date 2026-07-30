import { NextResponse } from 'next/server';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { TipDedicatie } from '@/lib/types';

// Cifrele financiare sunt doar pentru rolul 'admin' (Sarcina D,
// IMPLEMENTARE-V2.md) — verificat aici, server-side, nu doar prin
// ascunderea paginii in navigare.
export async function GET(req: Request) {
  const mod = await obtineModeratorApi();
  if (!mod || mod.rol !== 'admin') {
    return NextResponse.json({ error: 'Fără drepturi.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('event_id');
  if (!eventId) return NextResponse.json({ error: 'event_id lipsă.' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from('dedicatii')
    .select('tip, suma_bani, status_plata, status_moderare, status_difuzare, sursa_platforma')
    .eq('event_id', eventId)
    .in('status_plata', ['paid', 'refunded']);

  const randuri = data ?? [];
  const totalIncasat = randuri.filter((r) => r.status_plata === 'paid').reduce((s, r) => s + r.suma_bani, 0);
  const totalRambursat = randuri.filter((r) => r.status_plata === 'refunded').reduce((s, r) => s + r.suma_bani, 0);

  const perTip: Partial<Record<TipDedicatie, number>> = {};
  const perSursa: Record<string, number> = {};
  let aprobate = 0;
  let respinse = 0;
  let difuzate = 0;
  for (const r of randuri) {
    const tip = r.tip as TipDedicatie;
    perTip[tip] = (perTip[tip] ?? 0) + 1;
    perSursa[r.sursa_platforma] = (perSursa[r.sursa_platforma] ?? 0) + 1;
    if (r.status_moderare === 'aprobat') aprobate += 1;
    if (r.status_moderare === 'respins') respinse += 1;
    if (r.status_difuzare === 'difuzat') difuzate += 1;
  }

  return NextResponse.json({
    totalIncasat,
    totalRambursat,
    perTip,
    perSursa,
    aprobate,
    respinse,
    difuzate,
    total: randuri.length,
  });
}
