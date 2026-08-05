'use client';
import { useEffect, useRef, useState } from 'react';

interface DedicatieStream {
  mesaj: string | null;
  de_la: string | null;
  pentru: string | null;
}

const DURATA_FALLBACK_MS = 12000;
const DURATA_RETRY_MS = 5000;

// Sarcina V4-G4: overlay-ul (OBS/vMix) afiseaza acum exclusiv dedicatiile
// tip='stream', revendicate automat (fara operator), la fel ca ecranele din
// sala — vezi /api/overlay/[slug]/next. Fundal transparent: cand nu e nimic
// de aratat, ramane pur si simplu gol (nu are nevoie de umplutura, spre
// deosebire de un ecran fizic — aici sub el ruleaza deja transmisiunea live).
export function OverlayClient({ slug, apiKey }: { slug: string; apiKey: string }) {
  const [ded, setDed] = useState<DedicatieStream | null>(null);
  const [cheieAnimatie, setCheieAnimatie] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anulatRef = useRef(false);

  useEffect(() => {
    anulatRef.current = false;

    async function urmatorul() {
      if (anulatRef.current) return;
      try {
        const res = await fetch('/api/overlay/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, key: apiKey }),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('raspuns invalid');
        const data = await res.json();
        if (anulatRef.current) return;
        setDed(data.dedicatie ?? null);
        if (data.dedicatie) setCheieAnimatie((c) => c + 1);
        programeaza(typeof data.durata_secunde === 'number' ? data.durata_secunde * 1000 : DURATA_FALLBACK_MS);
      } catch {
        if (!anulatRef.current) programeaza(DURATA_RETRY_MS);
      }
    }

    function programeaza(intarziereMs: number) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(urmatorul, intarziereMs);
    }

    urmatorul();

    return () => {
      anulatRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [slug, apiKey]);

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
      {ded && (
        <div
          key={cheieAnimatie}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="" width={96} height={96} style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div>
            <div className="brand" style={{ textAlign: 'left', marginBottom: 6 }}>Dedicație</div>
            <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.3, textAlign: 'left' }}>
              {ded.mesaj}
            </div>
            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 20, textAlign: 'left' }}>
              {ded.de_la && <>De la <strong style={{ color: 'var(--accent-hover)' }}>{ded.de_la}</strong></>}
              {ded.pentru && <> pentru <strong style={{ color: 'var(--accent-hover)' }}>{ded.pentru}</strong></>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
