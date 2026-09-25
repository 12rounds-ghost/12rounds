-- Sarcina: sectiune "Informatii importante" pe pagina publica a editiei
-- (acces in locatie, ora show-ului, pret bilet, dress code, contact) —
-- text liber, editabil per editie din admin, la fel ca "descriere".
alter table public.events
  add column if not exists informatii_importante text;
