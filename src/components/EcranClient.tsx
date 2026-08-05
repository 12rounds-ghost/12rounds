'use client';
import { useEffect, useRef, useState } from 'react';

type Continut =
  | {
      tip: 'dedicatie';
      mesaj: string | null;
      de_la: string | null;
      pentru: string | null;
      poza_url: string | null;
      poza_latime: number | null;
      poza_inaltime: number | null;
    }
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
// mereu pe fullscreen). Serverul alterneaza deja dedicatie/umplere (V4-A3) —
// clientul doar afiseaza necondiționat ce primeste, la fiecare interval.
export function EcranClient({ id, apiKey }: { id: string; apiKey: string }) {
  const [continut, setContinut] = useState<Continut | null>(null);
  const [cheieAnimatie, setCheieAnimatie] = useState(0);
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
  }, [id, apiKey]);

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
    return <DedicatieCard continut={continut} />;
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

// Praguri de raport latime/inaltime (Sarcina V4-A4). Cadrul maxim e exprimat
// proportional la o referinta de 1920x1080, ca sa scaleze corect indiferent
// de rezolutia reala a ecranului fizic.
type Orientare = 'patrata' | 'portret' | 'peisaj';

function orientarePoza(latime: number, inaltime: number): Orientare {
  const raport = latime / inaltime;
  if (raport < 0.9) return 'portret';
  if (raport > 1.1) return 'peisaj';
  return 'patrata';
}

const CADRU_MAX: Record<Orientare, { maxWidth: string; maxHeight: string }> = {
  patrata: { maxWidth: '31.25vw', maxHeight: '55.6vh' }, // 600x600 la 1920x1080
  portret: { maxWidth: '25vw', maxHeight: '66.7vh' }, // 480x720 la 1920x1080
  peisaj: { maxWidth: '39.6vw', maxHeight: '47.2vh' }, // 760x510 la 1920x1080
};

function DedicatieCard({
  continut,
}: {
  continut: Extract<Continut, { tip: 'dedicatie' }>;
}) {
  // Poze vechi, incarcate inainte sa salvam poza_latime/poza_inaltime — le
  // citim in client din imaginea reala, fara salt vizual (afisam abia dupa
  // ce stim raportul).
  const [dimensiuniClient, setDimensiuniClient] = useState<{ l: number; h: number } | null>(null);
  const areDimensiuni = continut.poza_latime != null && continut.poza_inaltime != null;
  const [asteaptaDimensiuni, setAsteaptaDimensiuni] = useState(!!continut.poza_url && !areDimensiuni);

  const latime = continut.poza_latime ?? dimensiuniClient?.l ?? null;
  const inaltime = continut.poza_inaltime ?? dimensiuniClient?.h ?? null;
  const orientare = latime && inaltime ? orientarePoza(latime, inaltime) : 'patrata';
  const arePoza = !!continut.poza_url && !asteaptaDimensiuni;

  const esteLayoutPeisaj = arePoza && orientare === 'peisaj';
  const fontMesajVw = !arePoza ? 3.2 : esteLayoutPeisaj ? 3.75 : 5;

  return (
    <div
      className="ecran-continut"
      style={{
        maxWidth: '80vw',
        display: 'flex',
        flexDirection: esteLayoutPeisaj ? 'column' : 'row',
        alignItems: 'center',
        textAlign: esteLayoutPeisaj ? 'center' : 'left',
        gap: esteLayoutPeisaj ? 36 : 64,
      }}
    >
      {continut.poza_url && (
        <>
          {asteaptaDimensiuni && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={continut.poza_url}
              alt=""
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
              onLoad={(e) => {
                const img = e.currentTarget;
                setDimensiuniClient({ l: img.naturalWidth, h: img.naturalHeight });
                setAsteaptaDimensiuni(false);
              }}
            />
          )}
          {arePoza && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={continut.poza_url}
              alt=""
              style={{
                ...CADRU_MAX[orientare],
                width: 'auto',
                height: 'auto',
                aspectRatio: latime && inaltime ? `${latime} / ${inaltime}` : undefined,
                objectFit: 'contain',
                borderRadius: 24,
                border: '4px solid var(--accent, #e11d2e)',
                flexShrink: 0,
                background: '#0a0a0b',
              }}
            />
          )}
        </>
      )}
      <div>
        <img
          src="/logo.jpeg"
          alt=""
          style={{ width: '4.7vw', height: '4.7vw', borderRadius: '50%', marginBottom: 14, display: esteLayoutPeisaj ? 'inline-block' : 'block' }}
        />
        <div style={{ textTransform: 'uppercase', letterSpacing: 2, color: 'var(--accent, #e11d2e)', fontSize: '1.4vw', fontWeight: 700, marginBottom: 18 }}>
          Dedicație
        </div>
        <div style={{ fontSize: `${fontMesajVw}vw`, fontWeight: 600, lineHeight: 1.3 }}>„{continut.mesaj}”</div>
        <div style={{ marginTop: 28, fontSize: '1.6vw', color: '#b8b8bc' }}>
          {continut.de_la && <>De la <strong style={{ color: '#fff' }}>{continut.de_la}</strong></>}
          {continut.pentru && <> pentru <strong style={{ color: '#fff' }}>{continut.pentru}</strong></>}
        </div>
      </div>
    </div>
  );
}
