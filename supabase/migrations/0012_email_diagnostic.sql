-- Sarcina G (IMPLEMENTARE-V3.md): observabilitate pentru emailul de
-- confirmare, ca esecurile sa nu mai dispara fara urma.
alter table public.dedicatii
  add column if not exists email_trimis_la timestamptz,
  add column if not exists email_eroare text;
