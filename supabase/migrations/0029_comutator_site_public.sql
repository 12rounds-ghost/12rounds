-- Sarcina: comutator din admin pentru gate-ul "revenim in curand" (tot
-- site-ul, in spatele unei parole — src/middleware.ts). Pana acum singura
-- cale sa scoti gate-ul era o variabila de mediu (SITE_ACCESS_PASSWORD),
-- care cere redeploy. Acum admin-ul poate porni/opri gate-ul direct din
-- /admin/setari, fara sa implice un developer.
alter table public.setari_site
  add column if not exists site_public boolean not null default false;
