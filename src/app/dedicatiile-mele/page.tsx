'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { obtineDedicatiiLocale, type DedicatieLocala } from '@/lib/dedicatii-locale';
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

export default function DedicatiileMelePage() {
  const [intrari, setIntrari] = useState<IntrareCuStatus[] | null>(null);

  useEffect(() => {
    const locale = obtineDedicatiiLocale();
    if (locale.length === 0) {
      setIntrari([]);
      return;
    }
    Promise.all(
      locale.map(async (l) => {
        try {
          const res = await fetch(`/api/status/${l.id}`, { cache: 'no-store' });
          if (!res.ok) return null; // dedicatie stearsa/inexistenta — ignorata tacit
          const status = (await res.json()) as DedicatieStatusPublic;
          return { ...l, status };
        } catch {
          return null;
        }
      })
    ).then((rezultate) => {
      setIntrari(rezultate.filter((r): r is IntrareCuStatus => r !== null));
    });
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
