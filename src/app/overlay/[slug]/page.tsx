import { redirect } from 'next/navigation';

// Link vechi, dinainte de cele doua formate — redirectioneaza spre 16:9
// ca sa nu ramana rupt un link deja distribuit echipei tehnice. Pentru
// linkuri noi, foloseste direct /overlay/[slug]/16-9 sau /9-16.
export default function OverlayEvenimentVechi({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { key?: string };
}) {
  const query = searchParams.key ? `?key=${encodeURIComponent(searchParams.key)}` : '';
  redirect(`/overlay/${params.slug}/16-9${query}`);
}
