// Limitare simpla pe IP, in memorie — suficienta pentru un singur proces Node
// (ex. o instanta Vercel). Nu se sincronizeaza intre mai multe instante; daca
// aplicatia ajunge sa ruleze pe mai multe noduri simultan, inlocuieste cu
// Upstash Redis (acelasi API: verificaRateLimit(ip)).
const FEREASTRA_MS = 10 * 60 * 1000; // 10 minute
const LIMITA_CERERI = 10;

interface Contor {
  numar: number;
  resetareLa: number;
}

const contoare = new Map<string, Contor>();

export function verificaRateLimit(ip: string): boolean {
  const acum = Date.now();
  const contor = contoare.get(ip);

  if (!contor || acum > contor.resetareLa) {
    contoare.set(ip, { numar: 1, resetareLa: acum + FEREASTRA_MS });
    return true;
  }

  if (contor.numar >= LIMITA_CERERI) {
    return false;
  }

  contor.numar += 1;
  return true;
}

export function ipDinRequest(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'necunoscut';
}
