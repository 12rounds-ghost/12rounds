'use client';
import { useEffect, useRef, useState } from 'react';

type Continut =
  | { tip: 'dedicatie'; mesaj: string | null; de_la: string | null; pentru: string | null; artist_preferat: string | null; poza_url: string | null }
  | { tip: 'qr'; url: string; qr_data_url: string }
  | { tip: 'sponsor'; nume: string; logo_url: string }
  | { tip: 'branding' }
  | { tip: 'inactiv' };

const DURATA_FALLBACK_MS = 12000;
const DURATA_RETRY_MS = 5000;

// Kiosk fullscreen, fara stare persistata (niciun localStorage — un ecran
// se poate reporni oricand fara sa ramana blocat intr-o stare veche).
// Buclă recursivă cu setTimeout: cere urmatorul continut abia dupa ce s-a
// scurs durata celui curent, fara sa se bazeze pe vizibilitate (ecranul e
// mereu pe fullscreen).
export function EcranClient({ nr, apiKey }: { nr: number; apiKey: string }) {
  const [continut, setContinut] = useState<Continut | null>(null);
  const [cheieAnimatie, setCheieAnimatie] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anulatRef = useRef(false);

  useEffect(() => {
    anulatRef.current = false;

    async function urmatorul() {
      if (anulatRef.current) return;
      try {
        const res = await fetch(`/api/ecran/${nr}/next?key=${encodeURIComponent(apiKey)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('raspuns invalid');
        const data = await res.json();
        if (anulatRef.current) return;
        setContinut(data.continut as Continut);
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
  }, [nr, apiKey]);

  return (
    <div
      style={{
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--font-body, system-ui)',
      }}
    >
      <style>{`
        @keyframes ecran-intrare { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; } }
        .ecran-continut { animation: ecran-intrare 0.7s ease-out; }
      `}</style>
      {continut && <ContinutEcran key={cheieAnimatie} continut={continut} />}
    </div>
  );
}

function ContinutEcran({ continut }: { continut: Continut }) {
  if (continut.tip === 'inactiv') {
    return null;
  }

  if (continut.tip === 'dedicatie') {
    return (
      <div className="ecran-continut" style={{ maxWidth: '80vw', display: 'flex', alignItems: 'center', gap: 64 }}>
        {continut.poza_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={continut.poza_url}
            alt=""
            style={{ width: '28vw', height: '28vw', objectFit: 'cover', borderRadius: 24, border: '3px solid var(--accent, #e11d2e)', flexShrink: 0 }}
          />
        )}
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: 2, color: 'var(--accent, #e11d2e)', fontSize: '1.4vw', fontWeight: 700, marginBottom: 18 }}>
            Dedicație
          </div>
          <div style={{ fontSize: continut.poza_url ? '2.6vw' : '3.2vw', fontWeight: 600, lineHeight: 1.3 }}>
            „{continut.mesaj}”
          </div>
          <div style={{ marginTop: 28, fontSize: '1.6vw', color: '#b8b8bc' }}>
            {continut.de_la && <>De la <strong style={{ color: '#fff' }}>{continut.de_la}</strong></>}
            {continut.pentru && <> pentru <strong style={{ color: '#fff' }}>{continut.pentru}</strong></>}
            {continut.artist_preferat && <> · {continut.artist_preferat}</>}
          </div>
        </div>
      </div>
    );
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
