'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Wrapper peste playerul livrat separat (kit RoundsAnimation, NGM Creative —
// vendorizat integral in public/rounds-kit/, vezi README_RO.md/INTEGRARE_RO.md
// din pachetul original). Nu reimplementam nimic din randare/animatie aici —
// doar incarcam iframe-ul same-origin si expunem play()/stop() catre
// componentele care afiseaza efectiv dedicatiile (EcranClient, OverlayClient).
export type FormatRounds = 'hall1' | 'hall6' | 'wide' | 'tall';

export interface DateRedareCadou {
  id?: string;
  sender?: string | null;
  recipient?: string | null;
  message?: string | null;
  gift?: string | null;
  duration?: number;
  liveOpacity?: number;
  photoUrl?: string | null;
}

export interface RezultatRedare {
  id?: string;
  status: 'completed' | 'cancelled' | 'error';
  duration: number;
  fallback: boolean;
}

export interface RoundsPlayerHandle {
  play(data: DateRedareCadou): Promise<RezultatRedare>;
  stop(): void;
}

// API-ul expus de kit pe contentWindow — tipat minimal, doar ce folosim.
interface RoundsAnimationApi {
  ready: Promise<void>;
  play(data: DateRedareCadou): Promise<RezultatRedare>;
  stop(): void;
  setFormat(format: FormatRounds): void;
}

export const RoundsPlayer = forwardRef<RoundsPlayerHandle, { format: FormatRounds; style?: React.CSSProperties }>(
  function RoundsPlayer({ format, style }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const apiRef = useRef<RoundsAnimationApi | null>(null);
    // Promisiune "gata de redare" creata la montare — play() asteapta pe ea
    // in loc sa presupuna ca iframe-ul s-a incarcat deja, indiferent cat de
    // rapid vine primul apel dupa montare.
    const gataRef = useRef<{ promisiune: Promise<void>; rezolva: () => void }>();
    if (!gataRef.current) {
      let rezolva!: () => void;
      const promisiune = new Promise<void>((r) => {
        rezolva = r;
      });
      gataRef.current = { promisiune, rezolva };
    }

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      function laIncarcare() {
        const api = (iframe?.contentWindow as (Window & { RoundsAnimation?: RoundsAnimationApi }) | null)?.RoundsAnimation;
        if (!api) return;
        apiRef.current = api;
        api.ready.then(() => {
          api.setFormat(format);
          gataRef.current?.rezolva();
        });
      }

      iframe.addEventListener('load', laIncarcare);
      return () => iframe.removeEventListener('load', laIncarcare);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      async play(data) {
        await gataRef.current?.promisiune;
        if (!apiRef.current) throw new Error('Player indisponibil.');
        return apiRef.current.play(data);
      },
      stop() {
        apiRef.current?.stop();
      },
    }));

    return (
      <iframe
        ref={iframeRef}
        src={`/rounds-kit/index.html?clean=1&format=${format}`}
        title="Animație dedicație"
        style={{ border: 0, background: 'transparent', width: '100%', height: '100%', ...style }}
      />
    );
  }
);
