-- Sarcina V4-G (IMPLEMENTARE-V4.md): tipuri de dedicatii configurabile per
-- eveniment + tipul nou 'stream' (peste transmisiunea live, in overlay).

alter table public.tarife drop constraint if exists tarife_tip_check;
alter table public.tarife add constraint tarife_tip_check
  check (tip in ('sustinere','ecran','stream','prezentator'));

alter table public.dedicatii drop constraint if exists dedicatii_tip_check;
alter table public.dedicatii add constraint dedicatii_tip_check
  check (tip in ('sustinere','ecran','stream','prezentator'));

-- descriere editabila per eveniment (ce vede clientul sub numele pachetului)
-- si ordinea de afisare pe pagina publica.
alter table public.tarife
  add column if not exists descriere text,
  add column if not exists ordine int not null default 0;

-- fiecare eveniment existent primeste un tarif 'stream', dezactivat implicit
-- (fara pret presupus — proprietarul il activeaza si il preteaza cand e gata).
insert into public.tarife (event_id, tip, pret_bani, activ)
select id, 'stream', 0, false from public.events
on conflict (event_id, tip) do nothing;

-- ordine implicita stabila: sustinere, ecran, stream, prezentator
update public.tarife set ordine = case tip
  when 'sustinere' then 0
  when 'ecran' then 1
  when 'stream' then 2
  when 'prezentator' then 3
  else 99
end;

-- G4: overlay-ul (stream) are propriul interval configurabil, separat de
-- durata_afisare_secunde (folosit de ecranele din sala).
alter table public.events
  add column if not exists durata_stream_secunde int not null default 12;

-- G4: revendicare pentru overlay (stream) — aceeasi idee ca revendica_dedicatie
-- (ecrane), dar fara identitate de consumator (un singur overlay per eveniment,
-- nu mai multe ecrane simultane) si fara reciclare: overlay-ul e transparent
-- peste un stream deja in direct, nu are nevoie sa ramana mereu ocupat asa
-- cum are nevoie un ecran fizic din sala sa nu ramana negru.
create or replace function public.revendica_dedicatie_stream(p_event_id uuid)
returns setof public.dedicatii
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.dedicatii
  where event_id = p_event_id
    and tip = 'stream'
    and status_plata = 'paid'
    and status_moderare = 'aprobat'
    and status_difuzare = 'in_asteptare'
  order by created_at asc
  limit 1
  for update skip locked;

  if v_id is null then
    return;
  end if;

  update public.dedicatii
  set status_difuzare = 'difuzat',
      difuzat_la = now(),
      nr_difuzari = nr_difuzari + 1,
      ultima_difuzare = now()
  where id = v_id;

  return query select * from public.dedicatii where id = v_id;
end;
$$;
