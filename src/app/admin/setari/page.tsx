import { cereRol } from '@/lib/auth-admin';
import { supabaseServer } from '@/lib/supabase/server';
import { SetariClient } from '@/components/admin/SetariClient';
import type { SetariSite } from '@/lib/types';

export default async function SetariPage() {
  await cereRol(['admin']);

  const sb = supabaseServer();
  const { data } = await sb.from('setari_site').select('*').eq('id', 1).maybeSingle();

  return <SetariClient setariInitiale={data as SetariSite | null} />;
}
