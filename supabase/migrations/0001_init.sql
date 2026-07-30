-- 12 ROUNDS — schema initiala
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

-- ===== Tabele =====

create table public.events (
  id uuid primary key default gen_random_uuid(),
  nume text not null,
  data_show timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming','live','ended')),
  linkuri_stream jsonb not null default '{}'::jsonb, -- ex: {"youtube":"https://...","tiktok":"https://..."}
  mesaj_urmatorul_show text,
  created_at timestamptz not null default now()
);

create table public.moderatori (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  rol text not null default 'moderator' check (rol in ('admin','moderator','operator')),
  created_at timestamptz not null default now()
);

create table public.tarife (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  tip text not null check (tip in ('sustinere','ecran','prezentator')),
  pret_bani int not null, -- 7500 = 75.00 lei
  activ boolean not null default true,
  unique (event_id, tip)
);

create table public.dedicatii (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  moderator_id uuid references public.moderatori(id),
  tip text not null check (tip in ('sustinere','ecran','prezentator')),
  suma_bani int not null default 0,
  de_la text,
  pentru text,
  artist_preferat text,
  mesaj text,
  sursa_platforma text not null default 'direct',
  status_plata text not null default 'pending' check (status_plata in ('pending','paid','refunded')),
  status_moderare text not null default 'in_verificare' check (status_moderare in ('in_verificare','aprobat','respins')),
  status_difuzare text not null default 'in_asteptare' check (status_difuzare in ('in_asteptare','programat','difuzat')),
  stripe_session_id text,
  stripe_payment_intent text,
  motiv_respingere text,
  difuzat_la timestamptz,
  created_at timestamptz not null default now()
);

create index dedicatii_flux_idx on public.dedicatii (event_id, status_plata, status_moderare, status_difuzare);
create index dedicatii_stripe_idx on public.dedicatii (stripe_session_id);

-- ===== Row Level Security =====

alter table public.events enable row level security;
alter table public.moderatori enable row level security;
alter table public.tarife enable row level security;
alter table public.dedicatii enable row level security;

-- functie: utilizatorul autentificat este in echipa?
create or replace function public.este_moderator()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.moderatori where id = auth.uid());
$$;

-- events: oricine citeste; doar echipa modifica
create policy "events_citire_publica" on public.events
  for select using (true);
create policy "events_update_echipa" on public.events
  for update using (public.este_moderator());

-- tarife: publicul vede tarifele active; echipa le administreaza
create policy "tarife_citire_publica" on public.tarife
  for select using (activ = true or public.este_moderator());
create policy "tarife_admin_echipa" on public.tarife
  for all using (public.este_moderator());

-- dedicatii: citire publica (id-ul uuid este "secretul" paginii de status),
-- update doar echipa, insert doar prin service role (API-ul serverului).
-- NOTA: vezi README pentru varianta mai stricta cu view public.
create policy "dedicatii_citire_publica" on public.dedicatii
  for select using (true);
create policy "dedicatii_update_echipa" on public.dedicatii
  for update using (public.este_moderator());

-- moderatori: fiecare isi vede propriul rand
create policy "moderatori_citire_proprie" on public.moderatori
  for select using (id = auth.uid());

-- ===== Realtime =====

alter publication supabase_realtime add table public.dedicatii;
alter publication supabase_realtime add table public.events;

-- ===== Seed: o editie pilot + tarifele din pitch =====

insert into public.events (nume, data_show, status, mesaj_urmatorul_show)
values ('12 ROUNDS — Editia pilot', now() + interval '7 days', 'live',
        'Urmatorul show: in curand. Rezerva o dedicatie pentru urmatoarea editie.');

insert into public.tarife (event_id, tip, pret_bani)
select e.id, v.tip, v.pret
from public.events e,
     (values ('sustinere', 2500), ('ecran', 7500), ('prezentator', 25000)) as v(tip, pret);

-- ===== Dupa creare utilizatori (Authentication -> Users -> Add user), adauga-i in echipa: =====
-- insert into public.moderatori (id, email, rol)
-- select id, email, 'admin' from auth.users where email = 'adresa@ta.ro';
