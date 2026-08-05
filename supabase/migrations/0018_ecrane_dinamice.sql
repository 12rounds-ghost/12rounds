-- Sarcina V4-C (IMPLEMENTARE-V4.md): ecranele devin entitati administrabile,
-- cu token propriu, in loc de rute fixe /ecran/1, /ecran/2, /ecran/3 legate
-- de un numar din URL fara nicio evidenta in baza de date.

create table if not exists public.ecrane (
  id uuid primary key default gen_random_uuid(),
  nume text not null,
  token text not null default encode(gen_random_bytes(16), 'hex'),
  activ boolean not null default true,
  ordine int not null default 0,
  ultima_cerere timestamptz,
  ultima_dedicatie_id uuid references public.dedicatii(id) on delete set null,
  -- V4-A3: alternanta dedicatie/umplere si rotatia umpluturii (QR -> sponsor
  -- -> logo) — pastrate per ecran, nu existau in ecrane_config din V3.
  ultimul_tip text check (ultimul_tip in ('dedicatie', 'umplere')),
  filler_index int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists ecrane_token_idx on public.ecrane (token);

alter table public.ecrane enable row level security;
create policy "ecrane_admin" on public.ecrane for all using (public.este_moderator());

-- dedicatii: referinta catre ecran, in locul numarului fix
alter table public.dedicatii
  add column if not exists ecran_id uuid references public.ecrane(id) on delete set null;

-- migreaza ecranele existente (identificate pana acum doar prin numarul din
-- ecrane_config) in noua tabela, cu token generat automat per ecran.
do $$
declare
  r record;
  v_id uuid;
begin
  for r in select nr, nume, activ from public.ecrane_config loop
    insert into public.ecrane (nume, activ, ordine)
    values (coalesce(r.nume, 'Ecran ' || r.nr), r.activ, r.nr)
    returning id into v_id;

    update public.dedicatii set ecran_id = v_id where ecran_curent = r.nr;
  end loop;
end $$;

alter table public.dedicatii drop column if exists ecran_curent;
drop table if exists public.ecrane_config;

-- revendica_dedicatie primea un numar de ecran (int); acum primeste id-ul
-- ecranului (uuid). Semnatura veche se elimina explicit — create or replace
-- nu poate schimba tipul unui parametru.
drop function if exists public.revendica_dedicatie(uuid, int);

create or replace function public.revendica_dedicatie(p_event_id uuid, p_ecran_id uuid)
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
      ecran_id = p_ecran_id,
      nr_difuzari = nr_difuzari + 1,
      ultima_difuzare = now()
  where id = v_id;

  return query select * from public.dedicatii where id = v_id;
end;
$$;
