-- Sarcina B (IMPLEMENTARE-V2.md): uploadul pozelor trece exclusiv prin
-- /api/upload-poza (validare server-side: tip real prin magic bytes,
-- marime maxima, redimensionare/recomprimare cu sharp). Politica anterioara
-- (migratia 0008) permitea oricui sa urce direct in bucket-ul
-- poze-in-verificare prin API-ul Supabase Storage, ocolind aceasta validare
-- — un fisier de 20MB sau un continut redenumit .jpg ar fi trecut nefiltrat.
-- Ruleaza in Supabase: SQL Editor -> New query -> paste -> Run

drop policy if exists "upload_poze_public" on storage.objects;
