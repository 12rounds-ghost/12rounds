-- Sarcina: overlay de streaming in doua formate (16:9 si 9:16), care trebuie
-- sa arate ACEEASI dedicatie in ACELASI moment pe ambele pagini simultan
-- (cerinta echipei tehnice). Cu vechiul revendica_dedicatie_stream, fiecare
-- pagina care sondeaza independent ar revendica alta dedicatie (race) —
-- acum starea "ce ruleaza acum si pana cand" traieste pe eveniment, o singura
-- sursa de adevar pentru oricate pagini o citesc.
alter table public.events
  add column if not exists overlay_dedicatie_curenta_id uuid references public.dedicatii(id),
  add column if not exists overlay_afisata_la timestamptz,
  add column if not exists overlay_expira_la timestamptz;

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

  select dd.id into v_nou
  from public.dedicatii dd
  where dd.event_id = p_event_id
    and dd.tip = 'stream'
    and dd.status_plata = 'paid'
    and dd.status_moderare = 'aprobat'
    and dd.status_difuzare = 'in_asteptare'
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
    set status_difuzare = 'difuzat', difuzat_la = now(), nr_difuzari = nr_difuzari + 1
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
