'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { NUME_TIP, type Dedicatie } from '@/lib/types';
import { SelectorEveniment } from '@/components/SelectorEveniment';

// Ecranul operatorului video / prezentatorului (gândit pentru tabletă).
export function RegieClient() {
  const [coada, setCoada] = useState<Dedicatie[]>([]);
  const [peEcran, setPeEcran] = useState<Dedicatie | null>(null);
  const [eventId, setEventId] = useState('');

  const incarca = useCallback(async () => {
    // La fel ca în moderare: rezervările apar abia când event-ul lor devine
    // live; operatorul poate alege orice ediție explicit (implicit cea live).
    if (!eventId) {
      setPeEcran(null);
      setCoada([]);
      return;
    }
    const sb = supabaseBrowser();
    const { data } = await sb
      .from('dedicatii')
      .select('*')
      .eq('event_id', eventId)
      .eq('status_plata', 'paid')
      .eq('status_moderare', 'aprobat')
      .in('status_difuzare', ['in_asteptare', 'programat'])
      .order('created_at', { ascending: true });
    const lista = (data ?? []) as Dedicatie[];
    setPeEcran(lista.find((d) => d.status_difuzare === 'programat') ?? null);
    setCoada(lista.filter((d) => d.status_difuzare === 'in_asteptare'));
  }, [eventId]);

  useEffect(() => {
    incarca();
    const sb = supabaseBrowser();
    const canal = sb
      .channel('regie')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dedicatii' }, incarca)
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [incarca]);

  const sb = supabaseBrowser();

  async function trimitePeEcran(d: Dedicatie) {
    if (peEcran) {
      alert('Marchează întâi ca „Difuzat” dedicația de pe ecran.');
      return;
    }
    await sb.from('dedicatii').update({ status_difuzare: 'programat' }).eq('id', d.id);
  }

  async function marcheazaDifuzat(d: Dedicatie) {
    await sb
      .from('dedicatii')
      .update({ status_difuzare: 'difuzat', difuzat_la: new Date().toISOString() })
      .eq('id', d.id);
  }

  return (
    <div>
      <h1>Regie</h1>
      <p className="sub">
        „Pe ecran” trimite dedicația către overlay (sală + streamuri). „Difuzat” o scoate și
        eliberează ecranul.
      </p>

      <SelectorEveniment eventId={eventId} onChange={setEventId} />

      <h2 style={{ fontSize: 18 }}>Acum pe ecran</h2>
      {peEcran ? (
        <div className="card mesaj-card" style={{ borderColor: 'var(--accent)' }}>
          <div className="text">„{peEcran.mesaj}”</div>
          <div className="meta">
            De la <strong>{peEcran.de_la || '—'}</strong> pentru <strong>{peEcran.pentru || '—'}</strong>
          </div>
          <button className="btn ok touch" onClick={() => marcheazaDifuzat(peEcran)}>
            ✓ Difuzat — următorul
          </button>
        </div>
      ) : (
        <div className="card">Ecranul este liber.</div>
      )}

      <h2 style={{ fontSize: 18 }}>Coada aprobată ({coada.length})</h2>
      {coada.map((d) => (
        <div key={d.id} className="card mesaj-card">
          <div className="meta">
            <span className="badge gold">{NUME_TIP[d.tip]}</span>
            {d.artist_preferat && <span className="badge"> {d.artist_preferat}</span>}
          </div>
          <div className="text">„{d.mesaj}”</div>
          <div className="meta">
            De la <strong>{d.de_la || '—'}</strong> pentru <strong>{d.pentru || '—'}</strong>
          </div>
          <button className="btn touch" onClick={() => trimitePeEcran(d)}>▶ Pe ecran</button>
        </div>
      ))}
      {coada.length === 0 && <div className="card">Coada este goală.</div>}
    </div>
  );
}
