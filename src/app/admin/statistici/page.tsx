import { cereRol } from '@/lib/auth-admin';
import { supabaseServer } from '@/lib/supabase/server';
import { StatisticiClient } from '@/components/admin/StatisticiClient';

export default async function StatisticiPage() {
  await cereRol(['admin']);

  const sb = supabaseServer();
  const { data } = await sb.from('events').select('id, nume').order('created_at', { ascending: false });

  return <StatisticiClient evenimente={data ?? []} />;
}
