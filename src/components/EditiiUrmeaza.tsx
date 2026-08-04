import Link from 'next/link';
import { urlCoperta } from '@/lib/storage';
import { StareBadge } from '@/components/StareBadge';
import type { Event } from '@/lib/types';

// Carousel orizontal cu scroll-snap pentru edițiile viitoare (Sarcina A).
export function EditiiUrmeaza({ evenimente }: { evenimente: Event[] }) {
  if (evenimente.length === 0) return null;

  return (
    <div className="rail">
      {evenimente.map((ev) => (
        <Link key={ev.id} href={`/eveniment/${ev.slug}`} className="card-eveniment">
          <div
            className="card-eveniment-cover"
            style={{ backgroundImage: `url(${urlCoperta(ev.cover_path)})` }}
          />
          <div className="card-eveniment-body">
            <StareBadge
              status="upcoming"
              dataScurta={
                ev.data_show
                  ? new Date(ev.data_show).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
                  : null
              }
            />
            <div className="card-eveniment-titlu">{ev.nume}</div>
            {ev.data_show && (
              <div className="card-eveniment-data">
                {new Date(ev.data_show).toLocaleDateString('ro-RO', { dateStyle: 'medium' })}
                {ev.locatie ? ` · ${ev.locatie}` : ''}
              </div>
            )}
            {(ev.artist_a || ev.artist_b) && (
              <div className="card-eveniment-artisti">
                {ev.artist_a}
                {ev.artist_a && ev.artist_b ? ' vs ' : ''}
                {ev.artist_b}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
