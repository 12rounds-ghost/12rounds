import { supabaseServer } from '@/lib/supabase/server';
import { OverlayClient } from '@/components/OverlayClient';

export const dynamic = 'force-dynamic';

// Overlay legat de un eveniment specific — regia poate avea doua editii
// configurate (ex. una live, una in pregatire) fara sa amestece cozile
// (Sarcina C, IMPLEMENTARE-V2.md). Necesita ?key=... egal cu OVERLAY_SECRET;
// fara token valid, pagina nu afiseaza nimic.
export default async function OverlayEveniment({
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

  return <OverlayClient slug={event.slug} apiKey={secret} />;
}
