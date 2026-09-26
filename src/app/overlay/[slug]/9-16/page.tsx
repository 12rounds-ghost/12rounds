import { redirect } from 'next/navigation';

// Sarcina: inlocuit complet de layout-ul nou NGM Creative, cu doua pagini
// separate per platforma (Instagram/TikTok difera usor intre ele) — vezi
// ../instagram/page.tsx si ../tiktok/page.tsx. Ramane doar ca redirect, ca
// sa nu ramana rupt un link deja distribuit/salvat intr-un Browser Source.
export default function OverlayEveniment9x16Vechi({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { key?: string };
}) {
  const query = searchParams.key ? `?key=${encodeURIComponent(searchParams.key)}` : '';
  redirect(`/overlay/${params.slug}/instagram${query}`);
}
