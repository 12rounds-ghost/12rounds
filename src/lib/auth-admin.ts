import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export type RolModerator = 'admin' | 'moderator' | 'operator';

export interface ModeratorAutentificat {
  id: string;
  email: string;
  rol: RolModerator;
}

// Poarta de acces server-side pentru paginile /admin/* (Sarcina D,
// IMPLEMENTARE-V2.md). Ascunderea unui buton in interfata NU e o restrictie
// de acces — verificarea reala se face aici, in Server Component, inainte
// sa randam orice date.
export async function cereRol(roluriPermise: RolModerator[]): Promise<ModeratorAutentificat> {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: mod } = await sb.from('moderatori').select('id, email, rol').eq('id', user.id).maybeSingle();

  if (!mod || !roluriPermise.includes(mod.rol as RolModerator)) {
    redirect('/admin/acces-refuzat');
  }

  return mod as ModeratorAutentificat;
}

// Varianta pentru API routes (Route Handlers) — redirect() din next/navigation
// nu produce un raspuns HTTP normal in afara paginilor. Ruta decide ea insasi
// ce raspunde (401/403) dupa ce verifica rolul.
export async function obtineModeratorApi(): Promise<ModeratorAutentificat | null> {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: mod } = await sb.from('moderatori').select('id, email, rol').eq('id', user.id).maybeSingle();
  return (mod as ModeratorAutentificat) ?? null;
}
