-- Sarcina A (IMPLEMENTARE-V2.md): identitate publica pentru evenimente + poza
-- atasata dedicatiei. Pregateste terenul pentru Sarcina C (pagina principala
-- multi-eveniment) si Sarcina B (poze moderate).
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

-- ===== Evenimente: identitate publica =====

alter table public.events
  add column if not exists slug text,
  add column if not exists subtitlu text,
  add column if not exists descriere text,
  add column if not exists cover_path text,
  add column if not exists artist_a text,
  add column if not exists artist_b text,
  add column if not exists locatie text;

-- slug unic, folosit in URL: /eveniment/editia-pilot
update public.events set slug = 'editia-' || substr(id::text, 1, 8) where slug is null;
alter table public.events alter column slug set not null;
create unique index if not exists events_slug_idx on public.events (slug);

-- ===== Dedicatii: poza atasata =====

alter table public.dedicatii
  add column if not exists poza_path text,
  add column if not exists poza_aprobata boolean not null default false;

-- ===== Storage =====
-- Bucket-urile se creeaza manual din interfata Supabase (Storage -> New bucket),
-- inainte de a rula politicile de mai jos (altfel `bucket_id` nu exista inca):
--   covere              -> PUBLIC   (copertele evenimentelor, urcate doar de admin)
--   poze-in-verificare  -> PRIVAT   (pozele urcate de clienti, inainte de moderare)
--   poze-aprobate       -> PUBLIC   (pozele aprobate, servite in overlay)

-- Politici de storage (ruleaza dupa ce ai creat cele 3 bucket-uri):

create policy "upload_poze_public" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'poze-in-verificare');

create policy "citire_poze_echipa" on storage.objects
  for select to authenticated
  using (bucket_id = 'poze-in-verificare' and public.este_moderator());

create policy "covere_scriere_echipa" on storage.objects
  for all to authenticated
  using (bucket_id = 'covere' and public.este_moderator())
  with check (bucket_id = 'covere' and public.este_moderator());
