-- Sarcina 1: securizarea citirii dedicatiilor
-- Politica anterioara (dedicatii_citire_publica) permitea oricui cu cheia anon sa
-- citeasca toata tabela dedicatii, inclusiv mesaje respinse, sume si stripe_session_id.
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

drop policy if exists "dedicatii_citire_publica" on public.dedicatii;

create policy "dedicatii_citire_echipa" on public.dedicatii
  for select using (public.este_moderator());

-- Pagina publica de status (/status/[id]) nu mai citeste direct tabela: foloseste
-- src/app/api/status/[id]/route.ts, care trece prin supabaseAdmin() (service role,
-- ocoleste RLS) si returneaza doar coloanele necesare paginii.
