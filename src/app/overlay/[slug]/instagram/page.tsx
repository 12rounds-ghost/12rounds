import { supabaseServer } from '@/lib/supabase/server';
import { OverlaySocialClient } from '@/components/OverlaySocialClient';

export const dynamic = 'force-dynamic';

// Overlay Instagram Live, layout nou NGM Creative (Sarcina: inlocuieste
// vechiul /overlay/[slug]/9-16 — vezi OverlaySocialClient.tsx). Video-ul live
// trebuie pozitionat in OBS exact in zona intoarsa de getComposition().video
// din pagina incarcata in iframe.
export default async function OverlayEvenimentInstagram({
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

  return <OverlaySocialClient slug={event.slug} apiKey={secret} platform="instagram" />;
}
