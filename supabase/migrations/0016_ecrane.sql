-- Sarcina F (IMPLEMENTARE-V3.md): ecrane fizice din sala, rotire automata,
-- fara operator. Un ecran "revendica" urmatoarea dedicatie disponibila —
-- FOR UPDATE SKIP LOCKED garanteaza ca doua ecrane nu prind niciodata acelasi
-- mesaj in acelasi moment, chiar daca ambele interogheaza simultan.

alter table public.dedicatii
  add column if not exists ecran_curent int,
  add column if not exists nr_difuzari int not null default 0,
  add column if not exists ultima_difuzare timestamptz;

create table if not exists public.ecrane_config (
  nr int primary key,
  nume text,
  activ boolean not null default true,
  ultima_conectare timestamptz
);

alter table public.ecrane_config enable row level security;
create policy "ecrane_config_admin" on public.ecrane_config for all using (public.este_moderator());

-- Revendica urmatoarea dedicatie tip='ecran' pentru ecranul p_ecran:
-- 1) prioritate celor nearatate inca (status_difuzare='in_asteptare');
-- 2) daca nu mai exista niciuna noua, recicleaza cele deja difuzate,
--    incepand cu cea mai putin aratata (nr_difuzari asc) — asa nu se repeta
--    mereu acelasi mesaj cat timp coada de mesaje noi e goala.
create or replace function public.revendica_dedicatie(p_event_id uuid, p_ecran int)
returns setof public.dedicatii
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.dedicatii
  where event_id = p_event_id
    and tip = 'ecran'
    and status_plata = 'paid'
    and status_moderare = 'aprobat'
    and status_difuzare = 'in_asteptare'
  order by created_at asc
  limit 1
  for update skip locked;

  if v_id is null then
    select id into v_id
    from public.dedicatii
    where event_id = p_event_id
      and tip = 'ecran'
      and status_plata = 'paid'
      and status_moderare = 'aprobat'
      and status_difuzare = 'difuzat'
    order by nr_difuzari asc, ultima_difuzare asc nulls first
    limit 1
    for update skip locked;
  end if;

  if v_id is null then
    return;
  end if;

  update public.dedicatii
  set status_difuzare = 'difuzat',
      difuzat_la = coalesce(difuzat_la, now()),
      ecran_curent = p_ecran,
      nr_difuzari = nr_difuzari + 1,
      ultima_difuzare = now()
  where id = v_id;

  return query select * from public.dedicatii where id = v_id;
end;
$$;
