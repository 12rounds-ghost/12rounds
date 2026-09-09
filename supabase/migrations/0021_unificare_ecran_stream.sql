-- Sarcina: o dedicatie cumparata ca "in sala" (tip ecran) trebuie sa apara
-- O DATA si pe overlay-ul de streaming live, independent de rotatia ei pe
-- ecranele fizice din sala.
--
-- Ecranele fizice RECICLEAZA la nesfarsit (revendica_dedicatie, migratia
-- 0018) folosind status_difuzare/nr_difuzari — o dedicatie "difuzata" o
-- data ramane eligibila sa fie aratata din nou, ca sa umple rotatia.
-- Streamul insa trebuie sa arate fiecare dedicatie o SINGURA data. Daca am
-- refolosi acelasi camp status_difuzare si pentru stream, primul canal
-- care apuca dedicatia (ecran sau stream) ar "consuma-o" pentru celalalt
-- si invers — cele doua canale s-ar bloca reciproc. De-aia difuzat_pe_stream
-- e complet separat, nu atinge deloc logica ecranelor.
alter table public.dedicatii
  add column if not exists difuzat_pe_stream boolean not null default false;

-- Backfill: dedicatiile tip 'stream' deja difuzate sub logica veche
-- (avanseaza_overlay_stream folosea pana acum status_difuzare) nu trebuie
-- retrimise pe overlay dupa migrare.
update public.dedicatii
set difuzat_pe_stream = true
where tip = 'stream' and status_difuzare = 'difuzat';

create or replace function public.avanseaza_overlay_stream(p_event_id uuid, p_durata_secunde int)
returns table (id uuid, mesaj text, de_la text, pentru text)
language plpgsql
as $$
declare
  v_curent uuid;
  v_expira timestamptz;
  v_nou uuid;
begin
  -- blocam randul evenimentului cat calculam: a doua pagina care soseste in
  -- aceeasi fractiune de secunda asteapta lock-ul, apoi citeste direct ce a
  -- decis prima, in loc sa revendice ea insasi o alta dedicatie.
  select overlay_dedicatie_curenta_id, overlay_expira_la
    into v_curent, v_expira
  from public.events
  where events.id = p_event_id
  for update;

  if v_expira is not null and v_expira > now() then
    return query
      select d.id, d.mesaj, d.de_la, d.pentru
      from public.dedicatii d
      where d.id = v_curent;
    return;
  end if;

  -- tip in ('stream','ecran') — ambele canale se alimenteaza din acelasi
  -- bazin de dedicatii "in sala"/"pe live", fiecare independent.
  select dd.id into v_nou
  from public.dedicatii dd
  where dd.event_id = p_event_id
    and dd.tip in ('stream', 'ecran')
    and dd.status_plata = 'paid'
    and dd.status_moderare = 'aprobat'
    and dd.difuzat_pe_stream = false
  order by dd.created_at asc
  limit 1
  for update skip locked;

  if v_nou is null then
    update public.events
      set overlay_dedicatie_curenta_id = null, overlay_afisata_la = null, overlay_expira_la = null
      where events.id = p_event_id;
    return;
  end if;

  update public.dedicatii
    set difuzat_pe_stream = true
    where dedicatii.id = v_nou;

  update public.events
    set overlay_dedicatie_curenta_id = v_nou,
        overlay_afisata_la = now(),
        overlay_expira_la = now() + make_interval(secs => greatest(p_durata_secunde, 1))
    where events.id = p_event_id;

  return query
    select d.id, d.mesaj, d.de_la, d.pentru
    from public.dedicatii d
    where d.id = v_nou;
end;
$$;
