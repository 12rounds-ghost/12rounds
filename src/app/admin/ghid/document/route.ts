import { obtineModeratorApi } from '@/lib/auth-admin';
import { GHID_HTML } from '../ghid-html';
import { GHID_IMAGINI } from '../ghid-imagini';

export const dynamic = 'force-dynamic';

// Documentul cu imaginile deja inserate, calculat o singura data la incarcarea
// modulului (marcajele {{img:nume}} din ghid-html.ts -> data URI din ghid-imagini.ts).
const DOCUMENT = GHID_HTML.replace(/\{\{img:([a-z0-9-]+)\}\}/g, (_, nume: string) => GHID_IMAGINI[nume] ?? '');

// Documentul ghidului, servit doar echipei autentificate (orice rol din
// tabela moderatori) — nu il punem in public/, ca sa nu fie accesibil fara
// cont. Il afiseaza in iframe pagina /admin/ghid.
export async function GET() {
  const mod = await obtineModeratorApi();
  if (!mod) return new Response('Neautentificat', { status: 401 });

  return new Response(DOCUMENT, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
