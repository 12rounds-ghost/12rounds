// Script unic de migrare a datelor (Sarcina V4-A4, IMPLEMENTARE-V4.md).
// Completeaza poza_latime/poza_inaltime pentru dedicatiile care au deja o
// poza incarcata inainte ca /api/upload-poza sa inceapa sa salveze
// dimensiunile. Ruleaza o singura data, dupa migratia 0017_ecran_fixuri.sql.
//
// Utilizare:  node scripts/backfill-poza-dimensiuni.mjs
// Are nevoie de NEXT_PUBLIC_SUPABASE_URL si SUPABASE_SERVICE_ROLE_KEY in mediu
// (le incarca automat din .env.local daca ruleaza din radacina proiectului).

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

for (const linie of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = linie.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: randuri, error } = await sb
  .from('dedicatii')
  .select('id, poza_path, poza_aprobata')
  .not('poza_path', 'is', null)
  .is('poza_latime', null);

if (error) {
  console.error('Eroare la citire:', error.message);
  process.exit(1);
}

console.log(`${randuri.length} dedicatii cu poza fara dimensiuni salvate.`);

for (const r of randuri) {
  const bucket = r.poza_aprobata ? 'poze-aprobate' : 'poze-in-verificare';
  const { data: fisier, error: eDown } = await sb.storage.from(bucket).download(r.poza_path);
  if (eDown || !fisier) {
    console.warn(`- ${r.id}: nu am putut descarca din ${bucket}/${r.poza_path} (${eDown?.message ?? 'lipsa'})`);
    continue;
  }
  const buf = Buffer.from(await fisier.arrayBuffer());
  const meta = await sharp(buf).metadata();
  if (!meta.width || !meta.height) {
    console.warn(`- ${r.id}: nu am putut citi dimensiunile.`);
    continue;
  }
  const { error: eUpd } = await sb
    .from('dedicatii')
    .update({ poza_latime: meta.width, poza_inaltime: meta.height })
    .eq('id', r.id);
  if (eUpd) {
    console.warn(`- ${r.id}: eroare la salvare (${eUpd.message})`);
  } else {
    console.log(`- ${r.id}: ${meta.width}x${meta.height}`);
  }
}

console.log('Gata.');
