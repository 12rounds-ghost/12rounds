-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

-- Adauga statusul 'anulat' pentru evenimente (pe langa upcoming/live/ended) —
-- folosit cand un eveniment e amanat/anulat si trebuie sa arate un badge
-- distinct pe site, fara sa mai accepte plati pentru dedicatii.
alter table public.events drop constraint events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('upcoming','live','ended','anulat'));
