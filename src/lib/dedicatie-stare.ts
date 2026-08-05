import type { DedicatieStatusPublic } from './types';

// Stare finala: dedicatia nu se mai schimba, deci putem opri polling-ul.
// Introdus la Sarcina E (IMPLEMENTARE-V3.md), extras aici ca sa fie
// identic pe /status/[id] (StatusTimeline) si /dedicatiile-mele (Sarcina V4-B).
export function esteStareFinala(d: DedicatieStatusPublic): boolean {
  return (
    d.status_difuzare === 'difuzat' ||
    d.status_moderare === 'respins' ||
    d.status_plata === 'refunded'
  );
}
