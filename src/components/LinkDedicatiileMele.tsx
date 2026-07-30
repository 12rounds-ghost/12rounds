'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { obtineDedicatiiLocale } from '@/lib/dedicatii-locale';

// Sarcina E, Pasul 6: emailul e optional, deci linkul de status se poate
// pierde — afisam discret un acces catre istoricul local doar daca exista.
export function LinkDedicatiileMele() {
  const [areIntrari, setAreIntrari] = useState(false);

  useEffect(() => {
    setAreIntrari(obtineDedicatiiLocale().length > 0);
  }, []);

  if (!areIntrari) return null;

  return (
    <Link href="/dedicatiile-mele" className="link-dedicatiile-mele">
      Dedicațiile mele
    </Link>
  );
}
