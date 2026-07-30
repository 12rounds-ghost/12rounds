-- Fix: /overlay ruleaza neautentificat (browser source OBS/vMix), dar Sarcina 1
-- a restrans SELECT pe dedicatii doar la echipa (este_moderator()). Fara aceasta
-- politica, overlay-ul nu vede niciodata dedicatia 'programat' in productie.
--
-- Expunem public DOAR randul aflat efectiv pe ecran chiar acum (status_difuzare
-- = 'programat') — e continut deja destinat sutelor de spectatori din sala si
-- streamuri, deci nu e o scurgere de date. Politicile RLS se combina cu OR, deci
-- coexista cu "dedicatii_citire_echipa" fara sa slabeasca securitatea generala.
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

create policy "dedicatii_citire_publica_overlay" on public.dedicatii
  for select using (status_difuzare = 'programat');
