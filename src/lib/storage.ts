const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Coperta unui eveniment (bucket public 'covere'). Fara path, folosim logo-ul
// ca fallback vizual — nu toate evenimentele au o coperta urcata inca.
export function urlCoperta(coverPath: string | null): string {
  if (!coverPath) return '/logo.jpeg';
  return `${SUPABASE_URL}/storage/v1/object/public/covere/${coverPath}`;
}

// Poza aprobata a unei dedicatii (bucket public 'poze-aprobate'), afisata in overlay.
export function urlPozaAprobata(pozaPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/poze-aprobate/${pozaPath}`;
}

// Logo sponsor (bucket public 'sponsori', Sarcina A2).
export function urlSponsorLogo(logoPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/sponsori/${logoPath}`;
}

// Poza din galeria unei editii incheiate (bucket public 'galerie', Sarcina C4).
export function urlGalerie(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/galerie/${path}`;
}
