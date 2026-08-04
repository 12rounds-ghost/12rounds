-- Sarcina C4 (IMPLEMENTARE-V3.md): galerie foto pe pagina editiilor incheiate.
create table if not exists public.galerie (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  path text not null,
  descriere text,
  ordine int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.galerie enable row level security;
create policy "galerie_citire_publica" on public.galerie for select using (true);
create policy "galerie_admin" on public.galerie for all using (public.este_moderator());
