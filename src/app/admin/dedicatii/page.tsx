import { cereRol } from '@/lib/auth-admin';
import { supabaseServer } from '@/lib/supabase/server';
import { DedicatiiClient } from '@/components/admin/DedicatiiClient';

export default async function DedicatiiPage() {
  const mod = await cereRol(['admin', 'moderator']);

  const sb = supabaseServer();
  const { data: evenimente } = await sb.from('events').select('id, nume').order('created_at', { ascending: false });

  return <DedicatiiClient evenimente={evenimente ?? []} rol={mod.rol} />;
}
