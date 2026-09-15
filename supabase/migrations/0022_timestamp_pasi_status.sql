-- Sarcina: pagina de status a clientului (/status/[id]) arata pasii
-- (plata, verificare, aprobat, programat, difuzat) dar fara ora la care
-- s-a intamplat fiecare — clientul n-are niciun orizont de timp cat
-- asteapta. difuzat_la exista deja si e setat corect (revendica_dedicatie
-- si RegieClient.marcheazaDifuzat), dar plata si moderarea n-au avut
-- niciodata propriul lor timestamp — adaugam cele doua coloane lipsa.
alter table public.dedicatii
  add column if not exists platit_la timestamptz,
  add column if not exists moderat_la timestamptz;

-- Backfill pentru randurile existente: nu avem cum sa reconstituim
-- momentul exact retroactiv, deci folosim cea mai buna aproximare
-- disponibila (created_at) doar ca sa nu ramana campul gol la dedicatiile
-- vechi deja platite/moderate — de acum inainte, webhook-ul si actiunea
-- de aprobare/respingere din admin seteaza valoarea exacta.
update public.dedicatii
set platit_la = created_at
where status_plata in ('paid', 'refunded') and platit_la is null;

update public.dedicatii
set moderat_la = created_at
where status_moderare in ('aprobat', 'respins') and moderat_la is null;
