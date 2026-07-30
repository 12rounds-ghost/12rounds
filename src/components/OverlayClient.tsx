'use client';
import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { urlPozaAprobata } from '@/lib/storage';
import type { DedicatieOverlay, Event } from '@/lib/types';

const CAMPURI_OVERLAY = 'id, event_id, mesaj, de_la, pentru, artist_preferat, poza_path, poza_aprobata';

// Randarea efectiva a overlay-ului (OBS/vMix), pentru un singur eveniment.
// Token-ul de acces e verificat server-side, in pagina parinte — vezi
// src/app/overlay/page.tsx si src/app/overlay/[slug]/page.tsx.
// RLS (migratia 0007_overlay_public.sql) expune public DOAR randurile
// 'programat' — de aceea selectam explicit un subset minim de coloane,
// niciodata stripe_* sau suma_bani.
export function OverlayClient({ eventId }: { eventId: string }) {
  const [ded, setDed] = useState<DedicatieOverlay | null>(null);
  const [ascunsLocal, setAscunsLocal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();

    async function incarca() {
      const { data } = await sb
        .from('dedicatii')
        .select(CAMPURI_OVERLAY)
        .eq('event_id', eventId)
        .eq('status_difuzare', 'programat')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      setDed((data as DedicatieOverlay) ?? null);
    }
    incarca();

    const canal = sb
      .channel(`overlay-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dedicatii', filter: `event_id=eq.${eventId}` },
        incarca
      )
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [eventId]);

  // Durata de afisare si disparitia automata sunt setari per-eveniment
  // (configurabile din /admin/event). "Difuzat" ramane in continuare
  // deciza operatorului din /admin/regie — aici doar ascundem local cardul
  // dupa interval, ca sa nu ramana blocat pe ecran daca operatorul intarzie.
  useEffect(() => {
    setAscunsLocal(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!ded) return;

    let anulat = false;
    supabaseBrowser()
      .from('events')
      .select('durata_afisare_secunde, disparitie_automata')
      .eq('id', ded.event_id)
      .maybeSingle()
      .then(({ data }) => {
        if (anulat || !data) return;
        const ev = data as Pick<Event, 'durata_afisare_secunde' | 'disparitie_automata'>;
        if (ev.disparitie_automata) {
          timerRef.current = setTimeout(() => setAscunsLocal(true), ev.durata_afisare_secunde * 1000);
        }
      });

    return () => {
      anulat = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ded]);

  const deAfisat = ded && !ascunsLocal;

  return (
    <div
      style={{
        background: 'transparent',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 48,
      }}
    >
      {deAfisat && ded && (
        <div
          key={ded.id}
          style={{
            background: 'rgba(10,10,11,0.92)',
            border: '2px solid var(--accent)',
            borderRadius: 20,
            padding: '24px 40px 28px',
            maxWidth: 900,
            textAlign: 'center',
            animation: 'intrare 0.6s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: 28,
          }}
        >
          <style>{`@keyframes intrare { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }`}</style>
          {ded.poza_aprobata && ded.poza_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlPozaAprobata(ded.poza_path)} alt="" className="overlay-poza" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.jpeg" alt="" width={96} height={96} style={{ borderRadius: '50%', flexShrink: 0 }} />
          )}
          <div>
            <div className="brand" style={{ textAlign: 'left', marginBottom: 6 }}>Dedicație</div>
            <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.3, textAlign: 'left' }}>
              {ded.mesaj}
            </div>
            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 20, textAlign: 'left' }}>
              {ded.de_la && <>De la <strong style={{ color: 'var(--accent-hover)' }}>{ded.de_la}</strong></>}
              {ded.pentru && <> pentru <strong style={{ color: 'var(--accent-hover)' }}>{ded.pentru}</strong></>}
              {ded.artist_preferat && <> · {ded.artist_preferat}</>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
