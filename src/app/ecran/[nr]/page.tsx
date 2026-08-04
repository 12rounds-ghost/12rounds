import { EcranClient } from '@/components/EcranClient';

export const dynamic = 'force-dynamic';

// Poarta ecranului fizic din sala (Sarcina F, IMPLEMENTARE-V3.md). La fel ca
// /overlay — fara ?key= egal cu ECRAN_SECRET, pagina nu afiseaza nimic.
export default function EcranFizic({
  params,
  searchParams,
}: {
  params: { nr: string };
  searchParams: { key?: string };
}) {
  const secret = process.env.ECRAN_SECRET;
  const nr = Number(params.nr);

  if (!secret || searchParams.key !== secret || !Number.isInteger(nr) || nr <= 0) {
    return <div style={{ background: '#000', minHeight: '100vh' }} />;
  }

  return <EcranClient nr={nr} apiKey={searchParams.key} />;
}
