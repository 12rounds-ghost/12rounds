import { cereRol } from '@/lib/auth-admin';
import { supabaseServer } from '@/lib/supabase/server';
import { SponsoriAdminClient } from '@/components/admin/SponsoriAdminClient';

export default async function SponsoriPage() {
  await cereRol(['admin']);

  const sb = supabaseServer();
  const [{ data: sponsori }, { data: evenimente }] = await Promise.all([
    sb.from('sponsori').select('*').order('ordine', { ascending: true }),
    sb.from('events').select('id, nume').order('created_at', { ascending: false }),
  ]);

  return <SponsoriAdminClient sponsoriInitiali={sponsori ?? []} evenimente={evenimente ?? []} />;
}
