-- Sarcina: buton in admin "Retrimite pe stream" — la fel ca "Arata din nou pe
-- ecran" (0026), dar pentru transmisiunea live. Util pentru testare, fara sa
-- trebuiasca creata mereu o dedicatie noua: retrimite una deja existenta.
--
-- Toate dedicatiile "din sala" (tip='ecran') merg si pe live — asta era deja
-- adevarat din migratia 0021 (avanseaza_overlay_stream alege dintre
-- tip in ('stream','ecran')). Butonul de retrimitere pe stream trebuie deci
-- sa functioneze pentru ambele tipuri, nu doar pentru 'stream'.

alter table public.dedicatii
  add column if not exists redifuzare_fortata_stream boolean not null default false;

-- Semnatura de retur (id, mesaj, de_la, pentru, cadou) ramane neschimbata —
-- create or replace e suficient, fara drop.
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

  -- Prioritate: o redifuzare ceruta manual din admin sare in fata cozii
  -- normale — indiferent daca a fost deja aratata pe stream (difuzat_pe_stream
  -- nu conteaza aici, spre deosebire de coada normala de mai jos).
  select dd.id into v_nou
  from public.dedicatii dd
  where dd.event_id = p_event_id
    and dd.tip in ('stream', 'ecran')
    and dd.status_plata = 'paid'
    and dd.status_moderare = 'aprobat'
    and dd.redifuzare_fortata_stream = true
  order by dd.created_at asc
  limit 1
  for update skip locked;

  if v_nou is not null then
    update public.dedicatii set redifuzare_fortata_stream = false where dedicatii.id = v_nou;
  else
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
  end if;

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
