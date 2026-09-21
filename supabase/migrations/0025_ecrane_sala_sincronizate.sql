-- Sarcina: ecranele din sala (1 si 6) arata ACEEASI dedicatie in ACELASI
-- moment, fara cozi separate, si fiecare dedicatie apare de cel mult 2 ori
-- (fara reciclare infinita).
--
-- Pana acum fiecare ecran cerea singur "urmatoarea" dedicatie prin
-- revendica_dedicatie (0018): fiecare ecran avea ritmul lui, deci doua ecrane
-- ajungeau sa arate dedicatii diferite, iar cand nu mai era nimic nou,
-- dedicatiile se reciclau la infinit. Aici punem starea "ce ruleaza acum pe
-- ecranele din sala si pana cand" pe evenimentul insusi — exact ca la
-- overlay-ul de stream (0020) — ca oricate ecrane sondeaza sa vada acelasi
-- lucru. revendica_dedicatie ramane in baza de date, neutilizata (nu o
-- stergem: codul vechi inca il apeleaza pana la deploy).

alter table public.events
  add column if not exists ecran_dedicatie_curenta_id uuid references public.dedicatii(id) on delete set null,
  add column if not exists ecran_afisata_la timestamptz,
  add column if not exists ecran_expira_la timestamptz;

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
  -- Blocam randul evenimentului: cererile simultane ale celor doua ecrane se
  -- serializeaza aici, deci doar prima "avanseaza", a doua vede rezultatul ei.
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

  -- Urmatoarea: intai cele niciodata afisate (in ordinea sosirii), abia apoi
  -- a doua rotatie (cea mai demult afisata prima). O dedicatie noua sare
  -- mereu in fata rotatiei a doua. Nimic peste p_max_difuzari.
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
