'use client';
import { useEffect, useState } from 'react';
import { NUME_TIP, lei, type TipDedicatie } from '@/lib/types';

interface StatisticiRaspuns {
  totalIncasat: number;
  totalRambursat: number;
  perTip: Partial<Record<TipDedicatie, number>>;
  perSursa: Record<string, number>;
  aprobate: number;
  respinse: number;
  difuzate: number;
  total: number;
}

function Bara({ eticheta, valoare, total }: { eticheta: string; valoare: number; total: number }) {
  const procent = total > 0 ? Math.round((valoare / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="rand" style={{ marginBottom: 4 }}>
        <span>{eticheta}</span>
        <span className="sub" style={{ margin: 0 }}>{valoare} · {procent}%</span>
      </div>
      <div style={{ background: 'var(--panel-2)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${procent}%`, background: 'var(--accent)', height: '100%' }} />
      </div>
    </div>
  );
}

export function StatisticiClient({ evenimente }: { evenimente: { id: string; nume: string }[] }) {
  const [eventId, setEventId] = useState(evenimente[0]?.id ?? '');
  const [date, setDate] = useState<StatisticiRaspuns | null>(null);
  const [incarcare, setIncarcare] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setIncarcare(true);
    fetch(`/api/admin/statistici?event_id=${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        setDate(d);
        setIncarcare(false);
      });
  }, [eventId]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>Statistici</h1>
      {evenimente.length > 1 && (
        <div className="card">
          <label htmlFor="editie">Ediție</label>
          <select
            id="editie"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{
              width: '100%', background: 'var(--panel-2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 16,
            }}
          >
            {evenimente.map((e) => (
              <option key={e.id} value={e.id}>{e.nume}</option>
            ))}
          </select>
        </div>
      )}

      {incarcare || !date ? (
        <div className="card">Se încarcă…</div>
      ) : date.total === 0 ? (
        <div className="card">Nicio dedicație plătită pentru această ediție încă.</div>
      ) : (
        <>
          <div className="card rand">
            <div>
              <div className="sub" style={{ marginBottom: 2, textAlign: 'left' }}>Total încasat</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ok)' }}>{lei(date.totalIncasat)}</div>
            </div>
            <div>
              <div className="sub" style={{ marginBottom: 2, textAlign: 'left' }}>Total rambursat</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--accent-hover)' }}>{lei(date.totalRambursat)}</div>
            </div>
          </div>

          <div className="card">
            <h2>Dedicații pe tip</h2>
            {(Object.keys(NUME_TIP) as TipDedicatie[]).map((tip) => (
              <Bara key={tip} eticheta={NUME_TIP[tip]} valoare={date.perTip[tip] ?? 0} total={date.total} />
            ))}
          </div>

          <div className="card">
            <h2>Sursa banilor</h2>
            {Object.entries(date.perSursa)
              .sort((a, b) => b[1] - a[1])
              .map(([sursa, count]) => (
                <Bara key={sursa} eticheta={sursa} valoare={count} total={date.total} />
              ))}
          </div>

          <div className="card rand">
            <span>Moderare</span>
            <span className="badge" style={{ color: 'var(--ok)' }}>{date.aprobate} aprobate</span>
            <span className="badge warn">{date.respinse} respinse</span>
          </div>

          <div className="card rand">
            <span>Difuzate efectiv</span>
            <span className="badge gold">{date.difuzate} / {date.total}</span>
          </div>
        </>
      )}
    </div>
  );
}
