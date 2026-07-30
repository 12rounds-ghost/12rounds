-- Sarcina 5: rezervari pentru editia urmatoare
-- O dedicatie facuta cand niciun show nu e live, pentru un event 'upcoming'.
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

alter table public.dedicatii add column este_rezervare boolean not null default false;
