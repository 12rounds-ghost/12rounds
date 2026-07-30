'use client';
import { useState } from 'react';
import Link from 'next/link';
import { urlCoperta } from '@/lib/storage';
import type { Event } from '@/lib/types';

const PE_PAGINA = 12;

function BadgeEveniment({ event }: { event: Event }) {
  if (event.status === 'live') return <span className="badge-eveniment live">● LIVE</span>;
  if (event.status === 'upcoming') {
    const data = event.data_show
      ? new Date(event.data_show).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
      : null;
    return <span className="badge-eveniment upcoming">URMEAZĂ{data ? ` · ${data}` : ''}</span>;
  }
  return <span className="badge-eveniment ended">ÎNCHEIAT</span>;
}

export function EventGrid({ evenimente }: { evenimente: Event[] }) {
  const [vizibile, setVizibile] = useState(PE_PAGINA);

  if (evenimente.length === 0) return null;

  const afisate = evenimente.slice(0, vizibile);

  return (
    <>
      <div className="grid-evenimente">
        {afisate.map((ev) => (
          <Link key={ev.id} href={`/eveniment/${ev.slug}`} className="card-eveniment">
            <div
              className="card-eveniment-cover"
              style={{ backgroundImage: `url(${urlCoperta(ev.cover_path)})` }}
            />
            <div className="card-eveniment-body">
              <BadgeEveniment event={ev} />
              <div className="card-eveniment-titlu">{ev.nume}</div>
              {ev.data_show && (
                <div className="card-eveniment-data">
                  {new Date(ev.data_show).toLocaleDateString('ro-RO', {
                    dateStyle: 'long',
                  })}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {vizibile < evenimente.length && (
        <button className="btn secondary" onClick={() => setVizibile((v) => v + PE_PAGINA)}>
          Încarcă mai multe
        </button>
      )}
    </>
  );
}
