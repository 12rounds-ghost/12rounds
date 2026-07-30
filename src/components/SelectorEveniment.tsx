'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface EvenimentOptiune {
  id: string;
  nume: string;
  status: 'upcoming' | 'live' | 'ended';
}

const ETICHETA_STATUS: Record<EvenimentOptiune['status'], string> = {
  live: 'LIVE',
  upcoming: 'urmează',
  ended: 'încheiat',
};

// Dropdown de eveniment pentru /admin/moderare si /admin/regie — aceste
// panouri nu mai pot presupune ca exista un singur eveniment live (Sarcina C,
// IMPLEMENTARE-V2.md). Implicit selecteaza evenimentul live, daca exista.
export function SelectorEveniment({
  eventId,
  onChange,
}: {
  eventId: string;
  onChange: (id: string) => void;
}) {
  const [optiuni, setOptiuni] = useState<EvenimentOptiune[]>([]);

  useEffect(() => {
    supabaseBrowser()
      .from('events')
      .select('id, nume, status')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const lista = (data ?? []) as EvenimentOptiune[];
        setOptiuni(lista);
        const live = lista.find((e) => e.status === 'live');
        onChange((live ?? lista[0])?.id ?? '');
      });
    // rulează o singură dată, la montare — selecția ulterioară e manuală
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (optiuni.length === 0) return null;

  return (
    <select
      className="selector-eveniment"
      value={eventId}
      onChange={(e) => onChange(e.target.value)}
    >
      {optiuni.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nume} — {ETICHETA_STATUS[e.status]}
        </option>
      ))}
    </select>
  );
}
