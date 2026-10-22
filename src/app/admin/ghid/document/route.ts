import { obtineModeratorApi } from '@/lib/auth-admin';
import { GHID_HTML } from '../ghid-html';

export const dynamic = 'force-dynamic';

// Documentul ghidului, servit doar echipei autentificate (orice rol din
// tabela moderatori) — nu il punem in public/, ca sa nu fie accesibil fara
// cont. Il afiseaza in iframe pagina /admin/ghid.
export async function GET() {
  const mod = await obtineModeratorApi();
  if (!mod) return new Response('Neautentificat', { status: 401 });

  return new Response(GHID_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
