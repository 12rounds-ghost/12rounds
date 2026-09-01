import { supabaseServer } from '@/lib/supabase/server';
import { OverlayClient } from '@/components/OverlayClient';

export const dynamic = 'force-dynamic';

// Format 16:9 (1920x1080) — Browser Source dedicat, orizontal. Vezi si
// ../9-16/page.tsx (acelasi eveniment, layout separat, nu orizontalul
// micsorat — cerinta echipei tehnice).
export default async function OverlayEveniment16x9({
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

  return <OverlayClient slug={event.slug} apiKey={secret} format="16-9" />;
}
