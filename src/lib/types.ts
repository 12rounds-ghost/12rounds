export type TipDedicatie = 'sustinere' | 'ecran' | 'prezentator';

export interface Event {
  id: string;
  nume: string;
  data_show: string | null;
  status: 'upcoming' | 'live' | 'ended';
  linkuri_stream: Record<string, string>;
  mesaj_urmatorul_show: string | null;
  durata_afisare_secunde: number;
  disparitie_automata: boolean;
  slug: string;
  subtitlu: string | null;
  descriere: string | null;
  cover_path: string | null;
  artist_a: string | null;
  artist_b: string | null;
  locatie: string | null;
  created_at: string;
}

export interface Tarif {
  id: string;
  event_id: string;
  tip: TipDedicatie;
  pret_bani: number;
  activ: boolean;
}

export interface Dedicatie {
  id: string;
  event_id: string;
  tip: TipDedicatie;
  suma_bani: number;
  de_la: string | null;
  pentru: string | null;
  artist_preferat: string | null;
  mesaj: string | null;
  sursa_platforma: string;
  status_plata: 'pending' | 'paid' | 'refunded' | 'expired';
  status_moderare: 'in_verificare' | 'aprobat' | 'respins';
  status_difuzare: 'in_asteptare' | 'programat' | 'difuzat';
  stripe_payment_intent: string | null;
  motiv_respingere: string | null;
  este_rezervare: boolean;
  email: string | null;
  poza_path: string | null;
  poza_aprobata: boolean;
  nume_facturare: string | null;
  adresa_facturare: Record<string, unknown> | null;
  stripe_customer_id: string | null;
  factura_status: 'neemisa' | 'emisa' | 'eroare' | 'manual';
  factura_numar: string | null;
  factura_eroare: string | null;
  created_at: string;
}

// Subset public al unei dedicatii, expus de /api/status/[id] — niciodata
// stripe_* sau suma_bani.
export interface DedicatieStatusPublic {
  id: string;
  tip: TipDedicatie;
  pentru: string | null;
  de_la: string | null;
  status_plata: 'pending' | 'paid' | 'refunded' | 'expired';
  status_moderare: 'in_verificare' | 'aprobat' | 'respins';
  status_difuzare: 'in_asteptare' | 'programat' | 'difuzat';
  motiv_respingere: string | null;
  event_id: string;
  sursa_platforma: string;
}

// Subset public, expus de RLS doar cat timp status_difuzare = 'programat'
// (vezi migratia 0007_overlay_public.sql) — /overlay ruleaza neautentificat.
export interface DedicatieOverlay {
  id: string;
  event_id: string;
  mesaj: string | null;
  de_la: string | null;
  pentru: string | null;
  artist_preferat: string | null;
  poza_path: string | null;
  poza_aprobata: boolean;
}

export const NUME_TIP: Record<TipDedicatie, string> = {
  sustinere: 'Susține show-ul',
  ecran: 'Dedicație pe ecran',
  prezentator: 'Dedicație citită de prezentator',
};

export function lei(bani: number): string {
  return (bani / 100).toLocaleString('ro-RO') + ' lei';
}
