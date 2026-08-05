'use client';
import { useEffect, useRef, useState } from 'react';
import type { DedicatieStatusPublic } from '@/lib/types';
import { esteStareFinala } from '@/lib/dedicatie-stare';

// Sarcina E (IMPLEMENTARE-V3.md): polling explicit, nu Realtime — mai simplu
// si mai robust. Cauza reala a bug-ului raportat nu era RLS (status API
// foloseste service role, ocoleste RLS), ci lipsa oricarei legaturi cu
// document.visibilityState: pe telefon, un tab pus in fundal isi are
// timerele reduse/oprite de browser, iar la revenire pagina parea "blocata"
// pana la un refresh manual.
const INTERVAL_MS = 4000;
const INTERVAL_LENT_MS = 15000;
const PRAG_LENT_MS = 30 * 60 * 1000; // 30 minute fara schimbare -> polling mai rar

const PASI = [
  { cheie: 'plata', titlu: 'Plata confirmată', detaliu: 'Am primit plata ta.' },
  { cheie: 'verificare', titlu: 'Mesaj în verificare', detaliu: 'Moderatorul citește mesajul.' },
  { cheie: 'aprobat', titlu: 'Mesaj aprobat', detaliu: 'Mesajul a trecut de moderare.' },
  { cheie: 'programat', titlu: 'Programat pentru difuzare', detaliu: 'Urmează într-o tranziție.' },
  { cheie: 'difuzat', titlu: 'Difuzat', detaliu: 'Mesajul a apărut pe ecranele din sală.' },
] as const;

function pasCurent(d: DedicatieStatusPublic): number {
  if (d.status_plata !== 'paid' && d.status_plata !== 'refunded') return 0;
  if (d.status_moderare === 'in_verificare') return 1;
  if (d.status_moderare === 'respins') return -1;
  if (d.status_difuzare === 'difuzat') return 5;
  if (d.status_difuzare === 'programat') return 4;
  return 3; // aprobat, în așteptare
}

export function StatusTimeline({ initial }: { initial: DedicatieStatusPublic }) {
  const [ded, setDed] = useState(initial);
  const dedRef = useRef(ded);
  dedRef.current = ded;
  const ultimaSchimbareRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (esteStareFinala(dedRef.current)) return;
    let anulat = false;

    async function verifica() {
      if (anulat || document.visibilityState === 'hidden') return;
      try {
        // Foloseste /api/status-batch (POST), nu GET /api/status/[id]: in
        // productie, acel Route Handler GET cu segment dinamic [id] a ramas
        // inghetat la primul raspuns calculat, in ciuda export const dynamic
        // = 'force-dynamic' — un comportament de cache la nivel de platforma,
        // dovedit direct (acelasi id, acelasi raspuns invechit la infinit pe
        // GET, dar mereu proaspat pe POST). /dedicatiile-mele (Sarcina V4-B)
        // foloseste deja exclusiv batch-ul, de-asta nu a avut aceasta problema.
        const res = await fetch('/api/status-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [initial.id] }),
          cache: 'no-store',
        });
        if (!res.ok || anulat) return;
        const rezultate = (await res.json()) as DedicatieStatusPublic[];
        const proaspat = rezultate[0];
        if (!proaspat) return;
        if (JSON.stringify(proaspat) !== JSON.stringify(dedRef.current)) {
          setDed(proaspat);
          ultimaSchimbareRef.current = Date.now();
        }
        if (esteStareFinala(proaspat)) return; // stare finala — nu mai programam niciun tick
      } catch {
        // conexiune cazuta temporar — reincercam la urmatorul tick
      }
      programeaza();
    }

    function programeaza() {
      if (anulat) return;
      const lent = Date.now() - ultimaSchimbareRef.current > PRAG_LENT_MS;
      timeoutRef.current = setTimeout(verifica, lent ? INTERVAL_LENT_MS : INTERVAL_MS);
    }

    function laRevenire() {
      if (document.visibilityState === 'visible' && !esteStareFinala(dedRef.current)) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        verifica(); // refetch imediat, fara sa astepte urmatorul tick
      }
    }

    programeaza();
    document.addEventListener('visibilitychange', laRevenire);

    return () => {
      anulat = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', laRevenire);
    };
  }, [initial.id]);

  const curent = pasCurent(ded);

  if (ded.status_plata === 'refunded') {
    return (
      <div className="card">
        <strong>Plata a fost rambursată.</strong>
        <p className="detaliu" style={{ color: 'var(--muted)' }}>
          {ded.motiv_respingere ?? 'Dedicația nu a putut fi difuzată. Banii se întorc pe card în câteva zile.'}
        </p>
      </div>
    );
  }

  if (curent === -1) {
    return (
      <div className="card">
        <strong>Mesajul nu a fost aprobat.</strong>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {ded.motiv_respingere ?? 'Mesajul încalcă regulile show-ului.'} Vei primi rambursarea.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {PASI.map((p, i) => {
        const stare = i < curent ? 'trecut' : i === curent ? 'activ' : '';
        return (
          <div key={p.cheie} className={`pas ${stare}`}>
            <div key={curent} className={`bulina${i === curent ? ' bulina-noua' : ''}`}>
              {i < curent ? '✓' : ''}
            </div>
            <div>
              <div className="titlu">{p.titlu}</div>
              <div className="detaliu">{p.detaliu}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
