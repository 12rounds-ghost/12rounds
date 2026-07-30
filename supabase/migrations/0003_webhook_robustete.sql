-- Sarcina 2: idempotenta si robustete pe webhook
-- checkout.session.expired trebuie tratat: o dedicatie ramasa la 'pending'
-- cand sesiunea Stripe expira e marcata 'expired' (nu stearsa, ca sa pastram
-- un istoric al incercarilor abandonate).
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

alter table public.dedicatii drop constraint dedicatii_status_plata_check;
alter table public.dedicatii add constraint dedicatii_status_plata_check
  check (status_plata in ('pending','paid','refunded','expired'));
