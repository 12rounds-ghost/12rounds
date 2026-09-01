import { supabaseServer } from '@/lib/supabase/server';
import { OverlayClient } from '@/components/OverlayClient';
import { genereazaQrOverlay } from '@/lib/overlay-qr';

export const dynamic = 'force-dynamic';

// Fallback fara parametru — alege automat evenimentul live. Pastrat pentru
// regiile care nu au inca overlay-uri per-eveniment configurate (Sarcina C,
// IMPLEMENTARE-V2.md). Acelasi token ca /overlay/[slug]/16-9. Fara format in
// URL -> 16:9 implicit; pentru vertical, foloseste linkul cu slug explicit
// din pagina evenimentului din admin.
export default async function OverlayAutoLive({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const secret = process.env.OVERLAY_SECRET;
  if (!secret || searchParams.key !== secret) {
    return <div style={{ background: 'transparent', minHeight: '100vh' }} />;
  }

  const sb = supabaseServer();
  const { data: live } = await sb
    .from('events')
    .select('slug')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!live) return <div style={{ background: 'transparent', minHeight: '100vh' }} />;

  const qrDataUrl = await genereazaQrOverlay(live.slug);

  return <OverlayClient slug={live.slug} apiKey={secret} format="16-9" qrDataUrl={qrDataUrl} />;
}
