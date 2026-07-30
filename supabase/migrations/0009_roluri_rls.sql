-- Sarcina D (IMPLEMENTARE-V2.md): doar rolul 'admin' administreaza evenimente
-- si tarife. Verificarea de pagina (cereRol) e prima linie de aparare;
-- aceasta e a doua, la nivel de baza de date, in caz ca cineva apeleaza
-- direct API-ul Supabase ocolind interfata.
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

create or replace function public.este_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.moderatori where id = auth.uid() and rol = 'admin');
$$;

-- events: citirea publica ramane neschimbata; doar scrierea se restrange la admin
drop policy if exists "events_update_echipa" on public.events;
create policy "events_update_admin" on public.events
  for update using (public.este_admin());
create policy "events_insert_admin" on public.events
  for insert with check (public.este_admin());

-- tarife: citirea ramane la fel (tarife_citire_publica); doar scrierea se restrange
drop policy if exists "tarife_admin_echipa" on public.tarife;
create policy "tarife_scriere_admin" on public.tarife
  for all using (public.este_admin()) with check (public.este_admin());
