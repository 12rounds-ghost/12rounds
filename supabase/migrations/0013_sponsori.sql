-- Sarcina A2 (IMPLEMENTARE-V3.md): sponsori afisati pe prima pagina.
create table if not exists public.sponsori (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,  -- null = sponsor global
  nume text not null,
  logo_path text,
  url text,
  nivel text not null default 'sustinator' check (nivel in ('principal','sustinator')),
  ordine int not null default 0,
  activ boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sponsori enable row level security;
create policy "sponsori_citire_publica" on public.sponsori for select using (activ = true);
create policy "sponsori_admin" on public.sponsori for all using (public.este_moderator());
