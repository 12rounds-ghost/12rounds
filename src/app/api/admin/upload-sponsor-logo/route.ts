import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { obtineModeratorApi } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Sarcina V4-D (IMPLEMENTARE-V4.md): incarcarea logo-urilor de sponsor trece
// exclusiv prin acest API route, la fel ca la pozele de dedicatii
// (/api/upload-poza) — clientul nu mai scrie niciodata direct in Storage cu
// sesiunea lui, ca sa nu depindem de politici storage.objects separate.
const MARIME_MAXIMA = 5 * 1024 * 1024; // 5 MB
const LATURA_MAXIMA = 800;

function detecteazaTipRaster(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return 'png';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return null;
}

function esteSvg(buf: Buffer): boolean {
  const inceput = buf.subarray(0, 512).toString('utf8').trimStart().toLowerCase();
  return inceput.startsWith('<?xml') || inceput.startsWith('<svg') || inceput.includes('<svg');
}

// Sanitizare minimala pentru SVG — un logo se afiseaza mereu cu <img src=...>
// in aplicatie (niciodata inline in DOM), context in care browserele nu
// executa <script> oricum, dar eliminam explicit orice ar putea rula daca
// fisierul e deschis direct, navigand la URL-ul lui.
function sanitizeazaSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/(xlink:href|href)\s*=\s*"(javascript:|data:text\/html)[^"]*"/gi, '$1=""')
    .replace(/(xlink:href|href)\s*=\s*'(javascript:|data:text\/html)[^']*'/gi, "$1=''");
}

export async function POST(req: Request) {
  try {
    const mod = await obtineModeratorApi();
    if (!mod || mod.rol !== 'admin') {
      return NextResponse.json({ error: 'Fără drepturi.' }, { status: 403 });
    }

    const form = await req.formData();
    const fisier = form.get('fisier');
    if (!(fisier instanceof File)) {
      return NextResponse.json({ error: 'Niciun fișier primit.' }, { status: 400 });
    }
    if (fisier.size > MARIME_MAXIMA) {
      return NextResponse.json({ error: 'Fișierul este prea mare (maxim 5 MB).' }, { status: 400 });
    }

    const bufOriginal = Buffer.from(await fisier.arrayBuffer());
    const sb = supabaseAdmin();

    if (esteSvg(bufOriginal)) {
      const curatat = sanitizeazaSvg(bufOriginal.toString('utf8'));
      const numeFisier = `${crypto.randomUUID()}.svg`;
      const { error } = await sb.storage
        .from('sponsori')
        .upload(numeFisier, curatat, { contentType: 'image/svg+xml' });
      if (error) {
        console.error('upload-sponsor-logo (svg)', error);
        return NextResponse.json({ error: 'Încărcarea a eșuat pe server.' }, { status: 500 });
      }
      return NextResponse.json({ logo_path: numeFisier });
    }

    const tipRaster = detecteazaTipRaster(bufOriginal);
    if (!tipRaster) {
      return NextResponse.json(
        { error: 'Tip de fișier neacceptat. Sunt acceptate: PNG, JPEG, WEBP, SVG.' },
        { status: 400 }
      );
    }

    let bufProcesat: Buffer;
    try {
      bufProcesat = await sharp(bufOriginal)
        .rotate()
        .resize({ width: LATURA_MAXIMA, height: LATURA_MAXIMA, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch {
      return NextResponse.json({ error: 'Fișierul nu a putut fi procesat ca imagine.' }, { status: 400 });
    }

    const numeFisier = `${crypto.randomUUID()}.png`;
    const { error } = await sb.storage
      .from('sponsori')
      .upload(numeFisier, bufProcesat, { contentType: 'image/png' });
    if (error) {
      console.error('upload-sponsor-logo', error);
      return NextResponse.json({ error: 'Încărcarea a eșuat pe server.' }, { status: 500 });
    }

    return NextResponse.json({ logo_path: numeFisier });
  } catch (e) {
    console.error('upload-sponsor-logo error', e);
    return NextResponse.json({ error: 'A apărut o eroare pe server.' }, { status: 500 });
  }
}
