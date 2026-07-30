-- Sarcina E (SARCINA-E-PLATI-SI-FACTURARE.md): date de facturare pentru
-- plata one-tap (Apple/Google Pay) prin Express Checkout Element.
-- 'email' exista deja din 0005_email.sql — nu se readauga aici.
alter table public.dedicatii
  add column if not exists nume_facturare text,
  add column if not exists adresa_facturare jsonb,
  add column if not exists stripe_customer_id text,
  add column if not exists factura_status text not null default 'neemisa'
    check (factura_status in ('neemisa', 'emisa', 'eroare', 'manual')),
  add column if not exists factura_numar text,
  add column if not exists factura_eroare text;

create index if not exists dedicatii_factura_idx
  on public.dedicatii (factura_status)
  where factura_status in ('eroare', 'manual');
