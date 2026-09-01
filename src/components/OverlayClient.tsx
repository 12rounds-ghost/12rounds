'use client';
import { useEffect, useRef, useState } from 'react';

interface DedicatieStream {
  id: string;
  mesaj: string | null;
  de_la: string | null;
  pentru: string | null;
}

export type FormatOverlay = '16-9' | '9-16';

const INTERVAL_SONDARE_MS = 3000;
const INTERVAL_RETRY_MS = 5000;

// Sarcina: overlay de streaming in doua formate (16:9 si 9:16), pe doua
// pagini/linkuri separate, deschise simultan in doua Browser Source diferite
// din OBS/vMix — cerinta explicita a echipei tehnice: "verticalul trebuie
// facut separat, nu e orizontalul micsorat". Aceeasi componenta orchestreaza
// sincronizarea (identica pentru ambele formate), dar randeaza un layout
// distinct in functie de `format` — nu doar o scalare CSS a aceluiasi HTML.
//
// Sincronizare: ambele pagini sondeaza pe ritm propriu (nu mai depindem de
// durata_secunde ca sa stim cand sa cerem urmatoarea) — serverul e sursa de
// adevar pentru "ce ruleaza acum" (vezi /api/overlay/next +
// avanseaza_overlay_stream), deci indiferent cand soseste cererea de la
// fiecare pagina, ambele vad aceeasi dedicatie pana expira, apoi ambele trec
// la urmatoarea in acelasi timp. Animatia de intrare se declanseaza doar cand
// se schimba id-ul, nu la fiecare sondare.
export function OverlayClient({ slug, apiKey, format }: { slug: string; apiKey: string; format: FormatOverlay }) {
  const [ded, setDed] = useState<DedicatieStream | null>(null);
  const [cheieAnimatie, setCheieAnimatie] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anulatRef = useRef(false);
  const ultimulIdRef = useRef<string | null>(null);

  // globals.css pune fundal opac pe <body> pentru tot restul site-ului —
  // wrapper-ul cu background:'transparent' de mai jos sta DEASUPRA acelui
  // body opac, deci vizual tot opac ramane (gasit testand fluxul complet:
  // in OBS/vMix ca Browser Source, pagina aparea ca un dreptunghi negru
  // solid, nu transparenta). Suprascriem punctual doar aici, cat traieste
  // pagina de overlay.
  useEffect(() => {
    const fundalOriginal = document.body.style.background;
    document.body.style.background = 'transparent';
    return () => {
      document.body.style.background = fundalOriginal;
    };
  }, []);

  useEffect(() => {
    anulatRef.current = false;

    async function sondeaza() {
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
        const nou: DedicatieStream | null = data.dedicatie ?? null;
        setDed(nou);
        if (nou && nou.id !== ultimulIdRef.current) {
          setCheieAnimatie((c) => c + 1);
        }
        ultimulIdRef.current = nou?.id ?? null;
        programeaza(INTERVAL_SONDARE_MS);
      } catch {
        if (!anulatRef.current) programeaza(INTERVAL_RETRY_MS);
      }
    }

    function programeaza(intarziereMs: number) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(sondeaza, intarziereMs);
    }

    sondeaza();

    return () => {
      anulatRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [slug, apiKey]);

  return format === '9-16' ? (
    <OverlayVertical ded={ded} cheieAnimatie={cheieAnimatie} />
  ) : (
    <OverlayOrizontal ded={ded} cheieAnimatie={cheieAnimatie} />
  );
}

// 16:9 (1920x1080) — bara jos, latime completa, stil "lower third" clasic
// de emisie: mesajul citeste usor peste imaginea live din spate.
function OverlayOrizontal({ ded, cheieAnimatie }: { ded: DedicatieStream | null; cheieAnimatie: number }) {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes bara-intrare { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      {ded && (
        <div
          key={cheieAnimatie}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: '15.5vh',
            background: 'rgba(10,10,11,0.92)',
            borderTop: '0.3vh solid var(--accent, #e21d1d)',
            display: 'flex',
            alignItems: 'center',
            gap: '2vw',
            padding: '2vh 4vw',
            animation: 'bara-intrare 0.5s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="" style={{ width: '6vh', height: '6vh', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-hover, #ff2e2e)', fontSize: '1.6vh', marginBottom: '0.6vh' }}>
              Dedicație
            </div>
            <div style={{ fontSize: '2.9vh', fontWeight: 700, color: '#fff', lineHeight: 1.25, maxWidth: '82vw' }}>
              {ded.mesaj}
            </div>
            {(ded.de_la || ded.pentru) && (
              <div style={{ marginTop: '0.8vh', fontSize: '1.9vh', color: '#c8c8cc' }}>
                {ded.de_la && <>De la <strong style={{ color: '#fff' }}>{ded.de_la}</strong></>}
                {ded.pentru && <> pentru <strong style={{ color: '#fff' }}>{ded.pentru}</strong></>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 9:16 (1080x1920) — card in treimea inferioara, NU bara orizontala
// micsorata: pe verticalul de telefon zona de sus e de obicei acoperita de
// UI-ul platformei (nume cont, buton live) si cea de jos de comentarii/
// reactii — cardul sta intr-o zona de siguranta intre cele doua.
function OverlayVertical({ ded, cheieAnimatie }: { ded: DedicatieStream | null; cheieAnimatie: number }) {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes card-intrare { from { transform: translateY(4vh); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      {ded && (
        <div
          key={cheieAnimatie}
          style={{
            position: 'absolute',
            left: '6vw',
            right: '6vw',
            bottom: '20vh',
            background: 'rgba(10,10,11,0.92)',
            border: '0.25vh solid var(--accent, #e21d1d)',
            borderRadius: '2.2vh',
            padding: '3vh 5vw',
            textAlign: 'center',
            animation: 'card-intrare 0.5s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="" style={{ width: '7vh', height: '7vh', borderRadius: '50%', margin: '0 auto 1.6vh' }} />
          <div style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-hover, #ff2e2e)', fontSize: '1.9vh', marginBottom: '1.4vh' }}>
            Dedicație
          </div>
          <div style={{ fontSize: '3.1vh', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {ded.mesaj}
          </div>
          {(ded.de_la || ded.pentru) && (
            <div style={{ marginTop: '1.6vh', fontSize: '2.1vh', color: '#c8c8cc' }}>
              {ded.de_la && <>De la <strong style={{ color: '#fff' }}>{ded.de_la}</strong></>}
              {ded.pentru && <> pentru <strong style={{ color: '#fff' }}>{ded.pentru}</strong></>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
