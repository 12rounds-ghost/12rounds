import { supabaseAdmin } from '@/lib/supabase/admin';
import { EcranClient } from '@/components/EcranClient';
import type { Ecran } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Poarta ecranului fizic din sala (Sarcina V4-C, IMPLEMENTARE-V4.md). [id] e
// uuid-ul randului din tabela ecrane; ?key= trebuie sa fie tokenul propriu
// al acelui ecran (sau ECRAN_SECRET, cheia globala de rezerva). Fara token
// corect, pagina nu afiseaza nimic — la fel ca /overlay.
export default async function EcranFizic({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { key?: string };
}) {
  const sb = supabaseAdmin();
  const { data } = await sb.from('ecrane').select('id, token').eq('id', params.id).maybeSingle();
  const ecran = data as Pick<Ecran, 'id' | 'token'> | null;

  const secretGlobal = process.env.ECRAN_SECRET;
  const cheieValida =
    !!ecran && !!searchParams.key && (searchParams.key === ecran.token || (!!secretGlobal && searchParams.key === secretGlobal));

  if (!cheieValida) {
    return <div style={{ background: '#000', minHeight: '100vh' }} />;
  }

  return <EcranClient id={params.id} apiKey={searchParams.key!} />;
}
