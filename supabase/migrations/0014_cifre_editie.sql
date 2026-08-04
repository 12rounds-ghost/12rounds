-- Sarcina A / C (IMPLEMENTARE-V3.md): "spectatori" si "momente live" nu se
-- pot calcula din dedicatii — sunt cifre introduse manual de admin dupa
-- eveniment. Null = nu se afiseaza cardul respectiv (nu inventam date).
alter table public.events
  add column if not exists spectatori int,
  add column if not exists momente_live int;
