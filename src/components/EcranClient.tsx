'use client';
import { useEffect, useRef, useState } from 'react';
import { RoundsPlayer, type FormatRounds, type RoundsPlayerHandle } from '@/components/RoundsPlayer';

interface DedicatieEcran {
  tip: 'dedicatie';
  cheie: string;
  mesaj: string | null;
  de_la: string | null;
  pentru: string | null;
  poza_url: string | null;
  cadou: string | null;
}

type Continut = DedicatieEcran | { tip: 'branding' } | { tip: 'inactiv' };
type ItemCoada = DedicatieEcran & { durata: number | undefined };

const INTERVAL_SONDARE_MS = 2000;
const INTERVAL_RETRY_MS = 5000;
// Plasa de siguranta: daca ecranul ramane in urma (mesaje lungi, kit blocat),
// nu lasam coada sa creasca la nesfarsit.
const MAX_IN_COADA = 5;

// Kiosk fullscreen, fara stare persistata (niciun localStorage — un ecran
// se poate reporni oricand fara sa ramana blocat intr-o stare veche).
//
// Sarcina: ecranele din sala (1 si 6) arata ACEEASI dedicatie in ACELASI
// moment. Serverul e sursa de adevar pentru "ce ruleaza acum" (vezi
// /api/ecran/next + avanseaza_ecrane_sala), la fel ca la overlay-ul de stream;
// fiecare ecran doar sondeaza la 2s si reda ce vede. Decalajul intre ecrane e
// deci cel mult intervalul de sondare, nu mai exista cozi separate.
//
// Kit-ul RoundsAnimation isi prelungeste singur animatia pentru mesaje lungi
// (pana la 30s), iar asta nu se poate sti pe server. Ca sa nu taiem niciodata o
// animatie in curs, difuzarile noi intra intr-o coada locala si se reda pe rand
// — cateva secunde de decalaj la un mesaj lung sunt preferabile unei
// dedicatii intrerupte la jumatate.
export function EcranClient({ id, apiKey, format }: { id: string; apiKey: string; format: FormatRounds }) {
  const [continut, setContinut] = useState<Continut | null>(null);
  const playerRef = useRef<RoundsPlayerHandle>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anulatRef = useRef(false);
  const ultimaCheieRef = useRef<string | null>(null);
  const coadaRef = useRef<ItemCoada[]>([]);
  const ruleazaRef = useRef(false);
  // Ultimul lucru cerut de server cand nu e o dedicatie (logo/inactiv) — se
  // aplica abia cand coada s-a golit si animatia curenta s-a terminat. Cat
  // timp serverul inca raporteaza o dedicatie (chiar daca animatia a
  // terminat), nu aratam logo-ul: ar clipi intre doua difuzari consecutive.
  const fillerRef = useRef<Continut>({ tip: 'branding' });
  const serverLiberRef = useRef(false);

  useEffect(() => {
    anulatRef.current = false;

    async function ruleazaCoada() {
      if (ruleazaRef.current) return;
      ruleazaRef.current = true;
      while (coadaRef.current.length > 0 && !anulatRef.current) {
        const ded = coadaRef.current.shift()!;
        setContinut(ded);
        try {
          await playerRef.current?.play({
            sender: ded.de_la,
            recipient: ded.pentru,
            message: ded.mesaj,
            gift: ded.cadou,
            photoUrl: ded.poza_url,
            duration: ded.durata,
          });
        } catch (e) {
          console.error('Redarea dedicatiei a esuat', e);
        }
      }
      ruleazaRef.current = false;
      if (!anulatRef.current && serverLiberRef.current) setContinut(fillerRef.current);
    }

    async function sondeaza() {
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

        if (nou.tip === 'dedicatie') {
          serverLiberRef.current = false;
          if (nou.cheie !== ultimaCheieRef.current) {
            ultimaCheieRef.current = nou.cheie;
            coadaRef.current.push({
              ...nou,
              durata: typeof data.durata_secunde === 'number' ? data.durata_secunde : undefined,
            });
            if (coadaRef.current.length > MAX_IN_COADA) coadaRef.current.shift();
            ruleazaCoada();
          }
        } else {
          ultimaCheieRef.current = null;
          serverLiberRef.current = true;
          fillerRef.current = nou;
          // Nu intrerupem o dedicatie aflata in curs de redare: ruleazaCoada
          // aplica logo-ul singura, la final.
          if (!ruleazaRef.current) setContinut(nou);
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

      {continut && continut.tip === 'branding' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Branding />
        </div>
      )}
    </div>
  );
}

function Branding() {
  return (
    <div className="ecran-continut" style={{ textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpeg" alt="12 Rounds" style={{ width: '14vw', height: '14vw', borderRadius: '50%', margin: '0 auto 28px' }} />
      <div style={{ fontSize: '3.4vw', fontWeight: 800, letterSpacing: 1 }}>12 ROUNDS</div>
      <div style={{ fontSize: '1.4vw', color: '#b8b8bc', marginTop: 10 }}>The Battle of the Bands</div>
    </div>
  );
}
