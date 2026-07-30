import { notFound } from 'next/navigation';
import { cereRol } from '@/lib/auth-admin';
import { supabaseServer } from '@/lib/supabase/server';
import { EvenimentEditor } from '@/components/admin/EvenimentEditor';
import type { Event, Tarif } from '@/lib/types';

export default async function EvenimentAdminPage({ params }: { params: { id: string } }) {
  await cereRol(['admin']);

  const sb = supabaseServer();
  const { data: event } = await sb.from('events').select('*').eq('id', params.id).maybeSingle();
  if (!event) notFound();

  const { data: tarife } = await sb.from('tarife').select('*').eq('event_id', params.id);

  return <EvenimentEditor event={event as Event} tarife={(tarife ?? []) as Tarif[]} />;
}
