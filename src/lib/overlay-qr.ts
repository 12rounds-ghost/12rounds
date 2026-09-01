import QRCode from 'qrcode';

// Codul QR de pe overlay-ul de streaming e static pe durata unui show (link-ul
// evenimentului nu se schimba) — il generam o singura data, la incarcarea
// paginii, nu la fiecare sondare din OverlayClient (asta ar recalcula inutil
// aceeasi imagine de zeci de ori pe minut).
export async function genereazaQrOverlay(slug: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/eveniment/${slug}?src=stream`;
  return QRCode.toDataURL(url, { margin: 1, width: 300, color: { dark: '#0a0a0b', light: '#ffffff' } });
}
