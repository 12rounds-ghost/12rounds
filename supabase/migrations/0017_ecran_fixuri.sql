-- Sarcina V4-A (IMPLEMENTARE-V4.md): corectii ecrane sala.

-- A4: dimensiunile reale ale pozei, salvate la upload, ca sa nu mai fie
-- taiata intr-un cadru patrat fix — cadrul se adapteaza la raport.
alter table public.dedicatii
  add column if not exists poza_latime int,
  add column if not exists poza_inaltime int;

-- A3: memoram ultimul tip de continut aratat pe fiecare ecran, ca sa
-- alternam strict dedicatie/umplere in loc sa lasam reciclarea sa "castige"
-- mereu in fata umpluturii cand exista deja cel putin o dedicatie difuzata.
-- filler_index tine minte pozitia in rotatia umpluturii (QR -> sponsor -> logo).
alter table public.ecrane_config
  add column if not exists ultimul_tip text check (ultimul_tip in ('dedicatie', 'umplere')),
  add column if not exists filler_index int not null default 0;
