'use client';
import { useEffect, useRef, useState } from 'react';
import { RoundsPlayer, type RoundsPlayerHandle } from '@/components/RoundsPlayer';

interface DedicatieStream {
  id: string;
  mesaj: string | null;
  de_la: string | null;
  pentru: string | null;
  cadou: string | null;
}

export type FormatOverlay = '16-9' | '9-16';

const INTERVAL_SONDARE_MS = 3000;
const INTERVAL_RETRY_MS = 5000;

// Sarcina: overlay de streaming in doua formate (16:9 si 9:16), pe doua
// pagini/linkuri separate, deschise simultan in doua Browser Source diferite
// din OBS/vMix — cerinta explicita a echipei tehnice: "verticalul trebuie
// facut separat, nu e orizontalul micsorat".
//
// Sincronizare: ambele pagini sondeaza pe ritm propriu, dar serverul e sursa
// de adevar pentru "ce ruleaza acum" (vezi /api/overlay/next +
// avanseaza_overlay_stream) — asta NU s-a schimbat cu grafica noua. Am ales
// deliberat sa NU trecem avansarea pe finalizarea locala a playerului (cum
// am facut la /ecran, unde fiecare ecran fizic e independent): daca fiecare
// pagina ar decide singura cand trece la urmatoarea, cele doua iesiri
// (16:9/9:16, sau acelasi output deschis pe doua calculatoare) ar putea
// incepe sa arate dedicatii diferite in momente diferite — exact ce
// sincronizarea server-side de la 0020_overlay_sincronizat.sql a fost gandita
// sa previna. Deci: serverul decide TOT cand trecem la urmatoarea (neschimbat);
// playerul primeste durata_secunde ca hint, dar poate creste intern pentru
// texte lungi (comportament normal al kit-ului), fara sa afecteze avansarea.
//
// QR permanent (Sarcina: "sa nu avem timpi morti"): ramane exact ca inainte,
// randat separat de player, mereu vizibil.
export function OverlayClient({
  slug,
  apiKey,
  format,
  qrDataUrl,
}: {
  slug: string;
  apiKey: string;
  format: FormatOverlay;
  qrDataUrl: string;
}) {
  const playerRef = useRef<RoundsPlayerHandle>(null);
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
        if (nou && nou.id !== ultimulIdRef.current) {
          playerRef.current
            ?.play({
              id: nou.id,
              sender: nou.de_la,
              recipient: nou.pentru,
              message: nou.mesaj,
              gift: nou.cadou,
              duration: typeof data.durata_secunde === 'number' ? data.durata_secunde : undefined,
            })
            .catch((e) => console.error('Redarea dedicatiei a esuat', e));
        } else if (!nou) {
          playerRef.current?.stop();
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

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <RoundsPlayer ref={playerRef} format={format === '9-16' ? 'tall' : 'wide'} />
      </div>
      <QrBadge
        qrDataUrl={qrDataUrl}
        marimeQr={format === '9-16' ? '12vh' : '11vh'}
        top={format === '9-16' ? '9vh' : '3vh'}
        right={format === '9-16' ? '5vw' : '3vw'}
        padding={format === '9-16' ? '1.4vh' : '1.2vh'}
        fontSize={format === '9-16' ? '1.5vh' : '1.4vh'}
      />
    </div>
  );
}

// Colt fix, mereu vizibil — nu concureaza pozitional cu bara/cardul de
// dedicatie (care stau jos), asa ca nu se suprapun niciodata intre ele.
function QrBadge({
  qrDataUrl,
  marimeQr,
  top,
  right,
  padding,
  fontSize,
}: {
  qrDataUrl: string;
  marimeQr: string;
  top: string;
  right: string;
  padding: string;
  fontSize: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        right,
        background: 'rgba(10,10,11,0.85)',
        border: '0.15vh solid var(--accent, #e21d1d)',
        borderRadius: '1.4vh',
        padding,
        textAlign: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt=""
        style={{ width: marimeQr, height: marimeQr, display: 'block', borderRadius: '0.6vh' }}
      />
      <div style={{ marginTop: '0.7vh', fontSize, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
        Trimite o dedicație
      </div>
    </div>
  );
}
