// Badge unic pentru starea unui eveniment — reutilizat peste tot (Sarcina A3).
// Animatia de pulsatie respecta prefers-reduced-motion (vezi globals.css).
export function StareBadge({
  status,
  dataScurta,
}: {
  status: 'live' | 'upcoming' | 'ended';
  dataScurta?: string | null;
}) {
  if (status === 'live') return <span className="badge-eveniment live pulsand">● LIVE ACUM</span>;
  if (status === 'upcoming') {
    return <span className="badge-eveniment upcoming">URMEAZĂ{dataScurta ? ` · ${dataScurta}` : ''}</span>;
  }
  return <span className="badge-eveniment ended">ÎNCHEIAT</span>;
}
