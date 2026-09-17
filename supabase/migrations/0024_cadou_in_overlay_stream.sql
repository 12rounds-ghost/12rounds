-- Sarcina: grafica noua (kit RoundsAnimation) — avanseaza_overlay_stream
-- returneaza explicit doar (id, mesaj, de_la, pentru), nu setof dedicatii ca
-- revendica_dedicatie, deci "cadou" nu ajungea deloc la /api/overlay/next.
-- Aceeasi logica de revendicare (0020/0021), doar semnatura de retur creste.
-- Postgres nu permite CREATE OR REPLACE cand se schimba lista de coloane a
-- unui RETURNS TABLE — trebuie stearsa explicit intai (la fel ca in 0018).
drop function if exists public.avanseaza_overlay_stream(uuid, int);

create or replace function public.avanseaza_overlay_stream(p_event_id uuid, p_durata_secunde int)
returns table (id uuid, mesaj text, de_la text, pentru text, cadou text)
language plpgsql
as $$
declare
  v_curent uuid;
  v_expira timestamptz;
  v_nou uuid;
begin
  select overlay_dedicatie_curenta_id, overlay_expira_la
    into v_curent, v_expira
  from public.events
  where events.id = p_event_id
  for update;

  if v_expira is not null and v_expira > now() then
    return query
      select d.id, d.mesaj, d.de_la, d.pentru, d.cadou
      from public.dedicatii d
      where d.id = v_curent;
    return;
  end if;

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
    select d.id, d.mesaj, d.de_la, d.pentru, d.cadou
    from public.dedicatii d
    where d.id = v_nou;
end;
$$;
