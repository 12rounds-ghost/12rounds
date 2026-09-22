-- Sarcina: lansare site fara sectiunea de dedicatii (ramane doar un mesaj,
-- pana admin-ul activeaza formularul din editorul editiei), redifuzare
-- manuala pe ecran din admin, si o zona in admin pentru Google Tag.

-- 1) Comutator "formular de dedicatii vizibil", per editie. Backfill true
-- pentru editiile existente (nu schimbam nimic pentru editia de test care
-- ruleaza deja) — abia editiile CREATE dupa aceasta migratie pornesc ascunse,
-- ca sa nu uite cineva sa le activeze inainte de eveniment.
alter table public.events
  add column if not exists dedicatii_active boolean not null default true;
alter table public.events
  alter column dedicatii_active set default false;

-- 2) Redifuzare manuala pe ecran. Cu avanseaza_ecrane_sala (0025), ce se
-- afiseaza urmator nu mai depinde de status_difuzare, ci strict de
-- nr_difuzari — asa ca vechiul buton (care doar reseta status_difuzare) nu
-- mai avea niciun efect. O redifuzare fortata trebuie sa treaca inaintea
-- cozii normale, indiferent cate difuzari are deja, fara sa strice contorul
-- normal al rotatiei (nr_difuzari tot creste cu 1, ca evidenta corecta).
alter table public.dedicatii
  add column if not exists redifuzare_fortata boolean not null default false;

create or replace function public.avanseaza_ecrane_sala(
  p_event_id uuid,
  p_durata_secunde int,
  p_max_difuzari int default 2
)
returns table (
  id uuid,
  mesaj text,
  de_la text,
  pentru text,
  cadou text,
  poza_path text,
  poza_aprobata boolean,
  afisata_la timestamptz
)
language plpgsql
as $$
declare
  v_curent uuid;
  v_expira timestamptz;
  v_afisata timestamptz;
  v_nou uuid;
begin
  select events.ecran_dedicatie_curenta_id, events.ecran_expira_la, events.ecran_afisata_la
    into v_curent, v_expira, v_afisata
  from public.events
  where events.id = p_event_id
  for update;

  if v_curent is not null and v_expira is not null and v_expira > now() then
    return query
      select d.id, d.mesaj, d.de_la, d.pentru, d.cadou, d.poza_path, d.poza_aprobata, v_afisata
      from public.dedicatii d
      where d.id = v_curent;
    return;
  end if;

  -- Prioritate: o redifuzare ceruta manual din admin sare in fata cozii
  -- normale, indiferent de nr_difuzari.
  select dd.id into v_nou
  from public.dedicatii dd
  where dd.event_id = p_event_id
    and dd.tip = 'ecran'
    and dd.status_plata = 'paid'
    and dd.status_moderare = 'aprobat'
    and dd.redifuzare_fortata = true
  order by dd.ultima_difuzare asc nulls first
  limit 1
  for update skip locked;

  if v_nou is not null then
    update public.dedicatii set redifuzare_fortata = false where dedicatii.id = v_nou;
  else
    select dd.id into v_nou
    from public.dedicatii dd
    where dd.event_id = p_event_id
      and dd.tip = 'ecran'
      and dd.status_plata = 'paid'
      and dd.status_moderare = 'aprobat'
      and dd.nr_difuzari < p_max_difuzari
    order by dd.nr_difuzari asc, coalesce(dd.ultima_difuzare, dd.created_at) asc
    limit 1
    for update skip locked;
  end if;

  if v_nou is null then
    update public.events
      set ecran_dedicatie_curenta_id = null, ecran_afisata_la = null, ecran_expira_la = null
      where events.id = p_event_id;
    return;
  end if;

  update public.dedicatii
    set status_difuzare = 'difuzat',
        difuzat_la = coalesce(dedicatii.difuzat_la, now()),
        nr_difuzari = dedicatii.nr_difuzari + 1,
        ultima_difuzare = now()
    where dedicatii.id = v_nou;

  update public.events
    set ecran_dedicatie_curenta_id = v_nou,
        ecran_afisata_la = now(),
        ecran_expira_la = now() + make_interval(secs => greatest(p_durata_secunde, 1))
    where events.id = p_event_id
    returning events.ecran_afisata_la into v_afisata;

  return query
    select d.id, d.mesaj, d.de_la, d.pentru, d.cadou, d.poza_path, d.poza_aprobata, v_afisata
    from public.dedicatii d
    where d.id = v_nou;
end;
$$;

-- 3) O singura zona de setari globale (Google Tag ID, momentan). Un singur
-- rand fix (id=1), la fel ca alte "singleton"-uri Postgres.
create table if not exists public.setari_site (
  id smallint primary key default 1 check (id = 1),
  google_tag_id text,
  updated_at timestamptz not null default now()
);
insert into public.setari_site (id) values (1) on conflict (id) do nothing;

alter table public.setari_site enable row level security;
create policy "setari_site_citire_publica" on public.setari_site for select using (true);
create policy "setari_site_admin" on public.setari_site for all using (public.este_admin());
