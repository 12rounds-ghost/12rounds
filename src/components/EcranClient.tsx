'use client';
import { useEffect, useRef, useState } from 'react';
import { RoundsPlayer, type FormatRounds, type RoundsPlayerHandle } from '@/components/RoundsPlayer';

type Continut =
  | {
      tip: 'dedicatie';
      mesaj: string | null;
      de_la: string | null;
      pentru: string | null;
      poza_url: string | null;
      cadou: string | null;
    }
  | { tip: 'qr'; url: string; qr_data_url: string }
  | { tip: 'sponsor'; nume: string; logo_url: string }
  | { tip: 'branding' }
  | { tip: 'inactiv' };

const DURATA_FALLBACK_MS = 12000;
const DURATA_RETRY_MS = 5000;

// Kiosk fullscreen, fara stare persistata (niciun localStorage — un ecran
// se poate reporni oricand fara sa ramana blocat intr-o stare veche).
// Buclă recursivă: serverul alterneaza deja dedicatie/umplere (V4-A3).
//
// Sarcina: grafica noua (kit RoundsAnimation) — o dedicatie nu mai e randata
// cu CSS-ul nostru, ci trimisa playerului vendorizat (RoundsPlayer), care isi
// gestioneaza singur animatia si durata (creste pentru mesaje lungi). De-asta
// pentru 'dedicatie' NU mai programam next() cu un timer fix — asteptam
// finalizarea lui play(), apoi cerem imediat urmatorul continut. Umplutura
// (qr/sponsor/branding) ramane exact pe vechiul mecanism, cu timer.
export function EcranClient({ id, apiKey, format }: { id: string; apiKey: string; format: FormatRounds }) {
  const [continut, setContinut] = useState<Continut | null>(null);
  const [cheieAnimatie, setCheieAnimatie] = useState(0);
  const playerRef = useRef<RoundsPlayerHandle>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anulatRef = useRef(false);

  useEffect(() => {
    anulatRef.current = false;

    async function urmatorul() {
      if (anulatRef.current) return;
      try {
        const res = await fetch('/api/ecran/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, key: apiKey }),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('raspuns invalid');
        const data = await res.json();
        if (anulatRef.current) return;
        const nou = data.continut as Continut;
        setContinut(nou);

        if (nou.tip === 'dedicatie') {
          try {
            await playerRef.current?.play({
              sender: nou.de_la,
              recipient: nou.pentru,
              message: nou.mesaj,
              gift: nou.cadou,
              photoUrl: nou.poza_url,
            });
          } catch (e) {
            console.error('Redarea dedicatiei a esuat', e);
          }
          if (!anulatRef.current) urmatorul();
          return;
        }

        setCheieAnimatie((c) => c + 1);
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
  }, [id, apiKey]);

  return (
    <div
      style={{
        background: '#000',
        color: '#fff',
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-body, system-ui)',
      }}
    >
      <style>{`
        @keyframes ecran-intrare { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; } }
        .ecran-continut { animation: ecran-intrare 0.7s ease-out; }
      `}</style>

      <div style={{ position: 'absolute', inset: 0 }}>
        <RoundsPlayer ref={playerRef} format={format} />
      </div>

      {continut && continut.tip !== 'dedicatie' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ContinutFiller key={cheieAnimatie} continut={continut} />
        </div>
      )}
    </div>
  );
}

function ContinutFiller({ continut }: { continut: Exclude<Continut, { tip: 'dedicatie' }> }) {
  if (continut.tip === 'inactiv') {
    return null;
  }

  if (continut.tip === 'qr') {
    return (
      <div className="ecran-continut" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3vw', fontWeight: 700, marginBottom: 32 }}>Trimite și tu o dedicație</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={continut.qr_data_url} alt="Cod QR" style={{ width: '24vw', height: '24vw', background: '#fff', padding: 20, borderRadius: 16 }} />
        <div style={{ marginTop: 28, fontSize: '1.4vw', color: '#b8b8bc' }}>Scanează și mesajul tău ajunge pe ecran</div>
      </div>
    );
  }

  if (continut.tip === 'sponsor') {
    return (
      <div className="ecran-continut" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.3vw', textTransform: 'uppercase', letterSpacing: 2, color: '#b8b8bc', marginBottom: 24 }}>Partener</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={continut.logo_url} alt={continut.nume} style={{ maxWidth: '40vw', maxHeight: '30vh', objectFit: 'contain' }} />
      </div>
    );
  }

  return (
    <div className="ecran-continut" style={{ textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpeg" alt="12 Rounds" style={{ width: '14vw', height: '14vw', borderRadius: '50%', margin: '0 auto 28px' }} />
      <div style={{ fontSize: '3.4vw', fontWeight: 800, letterSpacing: 1 }}>12 ROUNDS</div>
      <div style={{ fontSize: '1.4vw', color: '#b8b8bc', marginTop: 10 }}>The Battle of the Bands</div>
    </div>
  );
}
