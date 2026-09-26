import { supabaseServer } from '@/lib/supabase/server';
import { OverlaySocialClient } from '@/components/OverlaySocialClient';

export const dynamic = 'force-dynamic';

// Overlay TikTok Live, layout nou NGM Creative — vezi ../instagram/page.tsx
// (aceeasi logica, doar compozitia video/sidebar difera usor intre platforme,
// ceea ce e stabilit in interiorul kit-ului, in tiktok.html).
export default async function OverlayEvenimentTikTok({
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

  return <OverlaySocialClient slug={event.slug} apiKey={secret} platform="tiktok" />;
}
