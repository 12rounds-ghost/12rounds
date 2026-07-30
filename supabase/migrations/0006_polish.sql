-- Sarcina 9: durata configurabila de afisare in overlay
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

alter table public.events add column durata_afisare_secunde int not null default 12;
alter table public.events add column disparitie_automata boolean not null default true;
