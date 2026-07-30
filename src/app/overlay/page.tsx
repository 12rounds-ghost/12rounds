import { supabaseServer } from '@/lib/supabase/server';
import { OverlayClient } from '@/components/OverlayClient';

export const dynamic = 'force-dynamic';

// Fallback fara parametru — alege automat evenimentul live. Pastrat pentru
// regiile care nu au inca overlay-uri per-eveniment configurate (Sarcina C,
// IMPLEMENTARE-V2.md). Acelasi token ca /overlay/[slug].
export default async function OverlayAutoLive({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const secret = process.env.OVERLAY_SECRET;
  if (!secret || searchParams.key !== secret) {
    // Fara token valid, pagina nu afiseaza nimic — e o fereastra in timp real
    // catre ce urmeaza pe ecran.
    return <div style={{ background: 'transparent', minHeight: '100vh' }} />;
  }

  const sb = supabaseServer();
  const { data: live } = await sb
    .from('events')
    .select('id')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!live) return <div style={{ background: 'transparent', minHeight: '100vh' }} />;

  return <OverlayClient eventId={live.id} />;
}
