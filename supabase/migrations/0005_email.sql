-- Sarcina 6: email de confirmare catre client
-- Emailul vine din Stripe Checkout (customer_details.email), salvat pe
-- dedicatie la confirmarea platii, pentru a trimite linkul de status.
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

alter table public.dedicatii add column email text;
