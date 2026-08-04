import Link from 'next/link';
import { urlCoperta } from '@/lib/storage';
import { StareBadge } from '@/components/StareBadge';
import type { Event } from '@/lib/types';

// Grila de editii incheiate, cu cifrele lor (Sarcina A). "12 Rounds" e o
// constanta a formatului (nu date per-editie); spectatori vine din DB —
// daca lipseste, nu il afisam (nu inventam cifre).
export function EditiiIncheiate({
  evenimente,
  difuzatePerEveniment,
}: {
  evenimente: Event[];
  difuzatePerEveniment: Map<string, number>;
}) {
  if (evenimente.length === 0) return null;

  return (
    <div className="grid3">
      {evenimente.map((ev) => (
        <Link key={ev.id} href={`/eveniment/${ev.slug}`} className="card-eveniment">
          <div
            className="card-eveniment-cover"
            style={{ backgroundImage: `url(${urlCoperta(ev.cover_path)})` }}
          />
          <div className="card-eveniment-body">
            <StareBadge status="ended" />
            <div className="card-eveniment-titlu">{ev.nume}</div>
            {ev.data_show && (
              <div className="card-eveniment-data">
                {new Date(ev.data_show).toLocaleDateString('ro-RO', { dateStyle: 'medium' })}
                {ev.locatie ? ` · ${ev.locatie}` : ''}
              </div>
            )}
            <div className="stats-row">
              <div>
                <b>{difuzatePerEveniment.get(ev.id) ?? 0}</b>
                <i>Dedicații</i>
              </div>
              <div>
                <b>12</b>
                <i>Rounds</i>
              </div>
              {ev.spectatori != null && (
                <div>
                  <b>{ev.spectatori.toLocaleString('ro-RO')}</b>
                  <i>Spectatori</i>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
