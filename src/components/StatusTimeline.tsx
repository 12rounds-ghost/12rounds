'use client';
import { useEffect, useRef, useState } from 'react';
import type { DedicatieStatusPublic } from '@/lib/types';

const INTERVAL_POLLING_MS = 5000;

function esteStareFinala(d: DedicatieStatusPublic): boolean {
  return (
    d.status_difuzare === 'difuzat' ||
    d.status_moderare === 'respins' ||
    d.status_plata === 'refunded'
  );
}

const PASI = [
  { cheie: 'plata', titlu: 'Plata confirmată', detaliu: 'Am primit plata ta.' },
  { cheie: 'verificare', titlu: 'Mesaj în verificare', detaliu: 'Moderatorul citește mesajul.' },
  { cheie: 'aprobat', titlu: 'Mesaj aprobat', detaliu: 'Mesajul a trecut de moderare.' },
  { cheie: 'programat', titlu: 'Programat pentru difuzare', detaliu: 'Urmează într-o tranziție.' },
  { cheie: 'difuzat', titlu: 'Difuzat', detaliu: 'Mesajul a apărut în sală și în transmisie.' },
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

  useEffect(() => {
    if (esteStareFinala(dedRef.current)) return;

    let anulat = false;
    const interval = setInterval(async () => {
      if (esteStareFinala(dedRef.current)) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`/api/status/${initial.id}`, { cache: 'no-store' });
        if (!res.ok || anulat) return;
        const proaspat = (await res.json()) as DedicatieStatusPublic;
        setDed(proaspat);
        if (esteStareFinala(proaspat)) clearInterval(interval);
      } catch {
        // conexiune cazuta temporar — reincercam la urmatorul tick
      }
    }, INTERVAL_POLLING_MS);

    return () => {
      anulat = true;
      clearInterval(interval);
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
            <div className="bulina">{i < curent ? '✓' : ''}</div>
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
