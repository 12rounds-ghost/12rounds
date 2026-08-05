import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verificaRateLimit, ipDinRequest } from '@/lib/rate-limit';

// Sarcina B (IMPLEMENTARE-V2.md): pozele urcate de public sunt cel mai mare
// risc de continut al proiectului — validare completa, server-side, inainte
// sa ajunga in bucket-ul privat poze-in-verificare. Clientul nu urca
// niciodata direct in Storage.
const MARIME_MAXIMA = 6 * 1024 * 1024; // 6 MB
const LATURA_MAXIMA = 1600;

function detecteazaTipImagine(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
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

export async function POST(req: Request) {
  try {
    if (!verificaRateLimit(ipDinRequest(req))) {
      return NextResponse.json(
        { error: 'Prea multe cereri. Te rugăm să încerci din nou peste câteva minute.' },
        { status: 429 }
      );
    }

    const form = await req.formData();
    const fisier = form.get('fisier');
    if (!(fisier instanceof File)) {
      return NextResponse.json({ error: 'Niciun fișier primit.' }, { status: 400 });
    }
    if (fisier.size > MARIME_MAXIMA) {
      return NextResponse.json({ error: 'Poza este prea mare (maxim 6 MB).' }, { status: 400 });
    }

    const bufOriginal = Buffer.from(await fisier.arrayBuffer());

    // Verificam continutul real, nu doar Content-Type-ul declarat de browser
    // — un PDF redenumit .jpg trebuie respins aici.
    if (!detecteazaTipImagine(bufOriginal)) {
      return NextResponse.json({ error: 'Fișierul nu este o imagine validă (jpeg, png sau webp).' }, { status: 400 });
    }

    let bufProcesat: Buffer;
    let latime: number | null = null;
    let inaltime: number | null = null;
    try {
      const rezultat = await sharp(bufOriginal)
        .rotate() // orientare corecta dupa EXIF (poze de telefon)
        .resize({ width: LATURA_MAXIMA, height: LATURA_MAXIMA, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      bufProcesat = rezultat.data;
      latime = rezultat.info.width;
      inaltime = rezultat.info.height;
    } catch {
      return NextResponse.json({ error: 'Fișierul nu a putut fi procesat ca imagine.' }, { status: 400 });
    }

    const numeFisier = `${crypto.randomUUID()}.jpg`;
    const sb = supabaseAdmin();
    const { error: eroareUpload } = await sb.storage
      .from('poze-in-verificare')
      .upload(numeFisier, bufProcesat, { contentType: 'image/jpeg' });

    if (eroareUpload) {
      console.error('upload poza', eroareUpload);
      return NextResponse.json({ error: 'Încărcarea a eșuat.' }, { status: 500 });
    }

    return NextResponse.json({ poza_path: numeFisier, poza_latime: latime, poza_inaltime: inaltime });
  } catch (e) {
    console.error('upload-poza error', e);
    return NextResponse.json({ error: 'A apărut o eroare. Încearcă din nou.' }, { status: 500 });
  }
}
