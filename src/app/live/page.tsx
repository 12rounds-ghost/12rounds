import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Ruta fixa, tiparita pe QR/bio-uri (Sarcina C, IMPLEMENTARE-V2.md). Nu se
// schimba niciodata, indiferent cate editii apar — mereu duce direct la
// formularul editiei live, intr-o singura redirectionare.
export default async function LiveRedirect() {
  const sb = supabaseServer();
  const { data: live } = await sb
    .from('events')
    .select('slug')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (live?.slug) redirect(`/eveniment/${live.slug}`);
  redirect('/');
}
