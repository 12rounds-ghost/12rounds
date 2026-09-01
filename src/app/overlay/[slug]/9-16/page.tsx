import { supabaseServer } from '@/lib/supabase/server';
import { OverlayClient } from '@/components/OverlayClient';
import { genereazaQrOverlay } from '@/lib/overlay-qr';

export const dynamic = 'force-dynamic';

// Format 9:16 (1080x1920) — Browser Source dedicat, vertical, layout
// construit separat (nu orizontalul micsorat). Vezi ../16-9/page.tsx.
export default async function OverlayEveniment9x16({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { key?: string };
}) {
  const secret = process.env.OVERLAY_SECRET;
  if (!secret || searchParams.key !== secret) {
    return <div style={{ background: 'transparent', minHeight: '100vh' }} />;
  }

  const sb = supabaseServer();
  const { data: event } = await sb.from('events').select('slug').eq('slug', params.slug).maybeSingle();

  if (!event) return <div style={{ background: 'transparent', minHeight: '100vh' }} />;

  const qrDataUrl = await genereazaQrOverlay(event.slug);

  return <OverlayClient slug={event.slug} apiKey={secret} format="9-16" qrDataUrl={qrDataUrl} />;
}
