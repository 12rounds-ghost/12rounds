'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { obtineDedicatiiLocale, type DedicatieLocala } from '@/lib/dedicatii-locale';
import { esteStareFinala } from '@/lib/dedicatie-stare';
import type { DedicatieStatusPublic } from '@/lib/types';

interface IntrareCuStatus extends DedicatieLocala {
  status: DedicatieStatusPublic;
}

const ETICHETA_PLATA: Record<DedicatieStatusPublic['status_plata'], string> = {
  pending: 'Plată în curs',
  paid: 'Plătită',
  refunded: 'Rambursată',
  expired: 'Expirată',
};

const ETICHETA_MODERARE: Record<DedicatieStatusPublic['status_moderare'], string> = {
  in_verificare: 'În verificare',
  aprobat: 'Aprobată',
  respins: 'Respinsă',
};

const ETICHETA_DIFUZARE: Record<DedicatieStatusPublic['status_difuzare'], string> = {
  in_asteptare: 'În așteptare',
  programat: 'Programată',
  difuzat: 'Difuzată',
};

// Sarcina V4-B (IMPLEMENTARE-V4.md): pagina citea o singura data, la montare,
// deci difuzarea unei dedicatii nu se reflecta aici fara refresh manual.
// Acelasi mecanism de polling ca /status/[id] (StatusTimeline): 4s, oprit
// cand tabul e ascuns, oprit cand toate intrarile sunt in stare finala —
// dar un singur apel batch pentru toata lista, nu unul per dedicatie.
const INTERVAL_MS = 4000;

export default function DedicatiileMelePage() {
  const [intrari, setIntrari] = useState<IntrareCuStatus[] | null>(null);
  const intrariRef = useRef(intrari);
  intrariRef.current = intrari;
  const localeRef = useRef<DedicatieLocala[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const locale = obtineDedicatiiLocale();
    localeRef.current = locale;
    if (locale.length === 0) {
      setIntrari([]);
      return;
    }

    let anulat = false;

    function toateFinale(lista: IntrareCuStatus[] | null): boolean {
      return lista !== null && lista.length > 0 && lista.every((i) => esteStareFinala(i.status));
    }

    async function verifica() {
      if (anulat || document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/status-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: localeRef.current.map((l) => l.id) }),
          cache: 'no-store',
        });
        if (!res.ok || anulat) return;
        const statusuri = (await res.json()) as DedicatieStatusPublic[];
        const dupaId = new Map(statusuri.map((s) => [s.id, s]));
        const noi = localeRef.current
          .map((l) => {
            const status = dupaId.get(l.id);
            return status ? { ...l, status } : null;
          })
          .filter((i): i is IntrareCuStatus => i !== null);
        setIntrari(noi);
        if (toateFinale(noi)) return; // toate in stare finala — nu mai programam niciun tick
      } catch {
        // conexiune cazuta temporar — reincercam la urmatorul tick
      }
      programeaza();
    }

    function programeaza() {
      if (anulat) return;
      timeoutRef.current = setTimeout(verifica, INTERVAL_MS);
    }

    function laRevenire() {
      if (document.visibilityState === 'visible' && !toateFinale(intrariRef.current)) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        verifica();
      }
    }

    verifica();
    document.addEventListener('visibilitychange', laRevenire);

    return () => {
      anulat = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', laRevenire);
    };
  }, []);

  return (
    <>
      <Header />
      <main className="container">
      <div className="brand">12 Rounds</div>
      <h1>Dedicațiile mele</h1>
      <p className="sub">Istoricul dedicațiilor trimise din acest browser.</p>

      {intrari === null && <div className="card">Se încarcă…</div>}

      {intrari?.length === 0 && (
        <div className="card">
          Nu am găsit nicio dedicație în acest browser.{' '}
          <Link href="/">Trimite una nouă</Link>
        </div>
      )}

      {intrari?.map((i) => (
        <Link key={i.id} href={`/status/${i.id}`} className="card rand rand-eveniment-dashboard">
          <div>
            <span className="badge">{ETICHETA_PLATA[i.status.status_plata]}</span>{' '}
            <span className="badge">{ETICHETA_MODERARE[i.status.status_moderare]}</span>{' '}
            <span className="badge">{ETICHETA_DIFUZARE[i.status.status_difuzare]}</span>
            <div className="sub" style={{ margin: '4px 0 0', textAlign: 'left' }}>
              {i.status.pentru ? `Pentru ${i.status.pentru}` : 'Susținere'}
              {' · '}
              {new Date(i.data).toLocaleDateString('ro-RO', { dateStyle: 'medium' })}
            </div>
          </div>
        </Link>
      ))}

      <Footer />
      </main>
    </>
  );
}
