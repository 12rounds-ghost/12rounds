-- Sarcina: grafica noua pentru dedicatii (kit 12_ROUNDS_Development_Kit_v2,
-- NGM Creative) — userul alege un "cadou" (ca la TikTok: coroana, inima,
-- trofeu etc.), afisat cu animatie prerandata pe ecranele din sala si pe
-- transmisiunea live. Obligatoriu doar pentru tip='ecran'/'stream' (singurele
-- afisate vizual cu acest player); ramane null pentru sustinere/prezentator.
alter table public.dedicatii
  add column if not exists cadou text
    check (cadou is null or cadou in ('crown','heart','trophy','bolt','diamond','star','fire','rocket','rose','champagne'));

comment on column public.dedicatii.cadou is
  'Identificatorul cadoului ales (kit RoundsAnimation) — obligatoriu doar pentru tip ecran/stream.';
