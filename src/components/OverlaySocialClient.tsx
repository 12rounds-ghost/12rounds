'use client';
import { useEffect, useRef } from 'react';

interface DedicatieStream {
  id: string;
  mesaj: string | null;
  de_la: string | null;
  pentru: string | null;
  cadou: string | null;
}

export type PlatformSocial = 'instagram' | 'tiktok';

interface RezultatRedareSocial {
  id?: string;
  status: 'completed' | 'cancelled' | 'error';
  duration: number;
  fallback: boolean;
}

// API-ul kit-ului nou (NGM Creative, "Social LIVE") — diferit de cel vechi
// (RoundsPlayer.tsx): nu are setFormat (fiecare platforma e propriul fisier
// HTML, nu un query param), dar are in plus getComposition().
interface RoundsAnimationSocialApi {
  ready: Promise<void>;
  play(data: {
    id?: string;
    sender: string;
    recipient: string;
    message: string;
    gift: string;
    duration?: number;
  }): Promise<RezultatRedareSocial>;
  stop(): void;
}

const INTERVAL_SONDARE_MS = 3000;
const INTERVAL_RETRY_MS = 5000;

// Sarcina: layout nou, dedicat Instagram/TikTok live (NGM Creative,
// "12_ROUNDS_Developers", vendorizat in public/rounds-kit-social/) —
// inlocuieste complet vechiul overlay 9:16 (cardul mic peste tot ecranul,
// vezi istoricul din OverlayClient.tsx). Layout-ul nou e o pagina intreaga
// de tip "broadcast": o coloana laterala PERMANENTA (decor, vizibila si
// cand nu ruleaza nicio dedicatie) + un cadru rezervat pentru fluxul video
// live + o zona de jos, intunecata, unde platforma isi pune propriile
// comentarii. Camera/video-ul live trebuie pozitionat de utilizator in OBS
// exact in dreptunghiul intors de getComposition().video — asta e o
// schimbare de configurare in OBS, nu doar de cod.
//
// Instagram si TikTok au dimensiuni usor diferite (pozitia video-ului),
// deci sunt doua fisiere HTML separate (instagram.html/tiktok.html), nu un
// singur fisier cu format ca parametru, ca la kit-ul vechi.
//
// Fara QR — coloana laterala e deja randata de kit, nu mai adaugam nimic
// peste; publicul e deja pe telefon, n-are de pe ce sa scaneze un cod.
export function OverlaySocialClient({
  slug,
  apiKey,
  platform,
}: {
  slug: string;
  apiKey: string;
  platform: PlatformSocial;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<RoundsAnimationSocialApi | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anulatRef = useRef(false);
  const ultimulIdRef = useRef<string | null>(null);
  // Promisiune "gata de redare", creata la montare (acelasi tipar ca
  // RoundsPlayer.tsx) — sondarea NU trebuie sa "uite" un id doar pentru ca
  // iframe-ul inca nu s-a incarcat cand a sosit primul raspuns; asteapta pe
  // ea in loc sa verifice sincron daca api-ul exista deja.
  const gataRef = useRef<{ promisiune: Promise<void>; rezolva: () => void }>();
  if (!gataRef.current) {
    let rezolva!: () => void;
    const promisiune = new Promise<void>((r) => {
      rezolva = r;
    });
    gataRef.current = { promisiune, rezolva };
  }

  // globals.css pune fundal opac pe <body> — vezi comentariul identic din
  // OverlayClient.tsx (gasit testand in OBS: pagina aparea neagra, nu
  // transparenta, fara asta).
  useEffect(() => {
    const fundalOriginal = document.body.style.background;
    document.body.style.background = 'transparent';
    return () => {
      document.body.style.background = fundalOriginal;
    };
  }, []);

  useEffect(() => {
    anulatRef.current = false;

    function laIncarcare() {
      const api = (
        iframeRef.current?.contentWindow as (Window & { RoundsAnimation?: RoundsAnimationSocialApi }) | null
      )?.RoundsAnimation;
      if (!api) return;
      apiRef.current = api;
      api.ready.then(() => {
        gataRef.current?.rezolva();
      });
    }
    const iframe = iframeRef.current;
    iframe?.addEventListener('load', laIncarcare);
    // fallback in caz ca 'load' a fost deja emis inainte sa atasam listener-ul
    if (iframe?.contentWindow && (iframe.contentWindow as Window & { RoundsAnimation?: unknown }).RoundsAnimation) {
      laIncarcare();
    }

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
          ultimulIdRef.current = nou.id;
          // Sender/recipient sunt obligatorii pentru kit-ul nou (arunca eroare
          // daca sunt goale) — spre deosebire de cel vechi. De_la/pentru insa
          // raman optionale in formular, deci punem un text implicit aici.
          gataRef.current?.promisiune
            .then(() =>
              apiRef.current?.play({
                id: nou.id,
                sender: nou.de_la?.trim() || 'Un fan',
                recipient: nou.pentru?.trim() || 'toată lumea',
                message: nou.mesaj?.trim() || '',
                gift: nou.cadou || 'crown',
                duration: typeof data.durata_secunde === 'number' ? data.durata_secunde : undefined,
              })
            )
            .catch((e) => console.error('Redarea dedicatiei a esuat', e));
        } else if (!nou) {
          ultimulIdRef.current = null;
          gataRef.current?.promisiune.then(() => apiRef.current?.stop());
        }
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
      iframe?.removeEventListener('load', laIncarcare);
    };
  }, [slug, apiKey]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src={`/rounds-kit-social/${platform}.html`}
        title="Overlay dedicații — live"
        style={{ border: 0, background: 'transparent', width: '100%', height: '100%' }}
      />
    </div>
  );
}
