export type TipDedicatie = 'sustinere' | 'ecran' | 'stream' | 'prezentator';

// Cadourile din kit-ul RoundsAnimation (12_ROUNDS_Development_Kit_v2) — un
// clip animat prerandat, cu propria paleta/caption, ales de user ca la
// cadourile TikTok. Obligatoriu doar pentru tip 'ecran'/'stream'.
export type CadouDedicatie =
  | 'crown' | 'heart' | 'trophy' | 'bolt' | 'diamond'
  | 'star' | 'fire' | 'rocket' | 'rose' | 'champagne';

export const CADOURI: CadouDedicatie[] = [
  'crown', 'heart', 'trophy', 'bolt', 'diamond', 'star', 'fire', 'rocket', 'rose', 'champagne',
];

export const NUME_CADOU: Record<CadouDedicatie, string> = {
  crown: 'Coroană — respect',
  heart: 'Inimă — dragoste',
  trophy: 'Trofeu — sărbătoare',
  bolt: 'Fulger — energie',
  diamond: 'Diamant — strălucire',
  star: 'Stea — ești vedeta',
  fire: 'Flacără — e seara ta',
  rocket: 'Rachetă — la înălțime',
  rose: 'Trandafir — pentru tine',
  champagne: 'Șampanie — sărbătorim',
};

export interface Event {
  id: string;
  nume: string;
  data_show: string | null;
  status: 'upcoming' | 'live' | 'ended';
  linkuri_stream: Record<string, string>;
  mesaj_urmatorul_show: string | null;
  durata_afisare_secunde: number;
  disparitie_automata: boolean;
  durata_stream_secunde: number;
  // Comutator per editie (Sarcina: lansare site fara dedicatii) — cat timp e
  // false, formularul public de dedicatii e ascuns, in orice status
  // (upcoming/live), inlocuit de un mesaj generic pe pagina editiei.
  dedicatii_active: boolean;
  slug: string;
  subtitlu: string | null;
  descriere: string | null;
  cover_path: string | null;
  artist_a: string | null;
  artist_b: string | null;
  locatie: string | null;
  spectatori: number | null;
  momente_live: number | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  event_id: string | null;
  nume: string;
  logo_path: string | null;
  url: string | null;
  nivel: 'principal' | 'sustinator';
  ordine: number;
  activ: boolean;
}

export interface PozaGalerie {
  id: string;
  event_id: string;
  path: string;
  descriere: string | null;
  ordine: number;
}

export interface Tarif {
  id: string;
  event_id: string;
  tip: TipDedicatie;
  pret_bani: number;
  activ: boolean;
  descriere: string | null;
  ordine: number;
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
  poza_latime: number | null;
  poza_inaltime: number | null;
  nume_facturare: string | null;
  adresa_facturare: Record<string, unknown> | null;
  stripe_customer_id: string | null;
  factura_status: 'neemisa' | 'emisa' | 'eroare' | 'manual';
  factura_numar: string | null;
  factura_eroare: string | null;
  email_trimis_la: string | null;
  email_eroare: string | null;
  ecran_id: string | null;
  nr_difuzari: number;
  ultima_difuzare: string | null;
  difuzat_la: string | null;
  platit_la: string | null;
  moderat_la: string | null;
  cadou: CadouDedicatie | null;
  // Setat din admin ("Arată din nou pe ecran") — avanseaza_ecrane_sala (0026)
  // o alege inaintea cozii normale, indiferent de nr_difuzari, apoi il pune
  // singura inapoi pe false.
  redifuzare_fortata: boolean;
  // Analog, dar pentru "Retrimite pe stream" — avanseaza_overlay_stream (0027).
  redifuzare_fortata_stream: boolean;
  created_at: string;
}

// Singurul rand de setari globale ale site-ului (Sarcina: Google Tag din admin).
export interface SetariSite {
  id: 1;
  google_tag_id: string | null;
  updated_at: string;
}

// Un ecran fizic din sala, ca entitate administrabila (Sarcina V4-C,
// IMPLEMENTARE-V4.md) — inlocuieste rutele fixe /ecran/1, /ecran/2, /ecran/3
// din V3. Fiecare ecran are propriul token, generat la creare din /admin/ecrane.
export interface Ecran {
  id: string;
  nume: string;
  token: string;
  activ: boolean;
  ordine: number;
  ultima_cerere: string | null;
  ultima_dedicatie_id: string | null;
  ultimul_tip: 'dedicatie' | 'umplere' | null;
  filler_index: number;
  created_at: string;
}

// Subset public al unei dedicatii, expus de /api/status/[id] — niciodata
// stripe_* sau suma_bani.
// platit_la/moderat_la/difuzat_la: momentul fiecarei tranzitii, pentru
// timeline-ul din StatusTimeline (Sarcina: orizont de timp pentru client).
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
  created_at: string;
  platit_la: string | null;
  moderat_la: string | null;
  difuzat_la: string | null;
}

export const NUME_TIP: Record<TipDedicatie, string> = {
  sustinere: 'Susține show-ul',
  ecran: 'Dedicație pe ecranele din sală',
  stream: 'Dedicație în transmisiunea live',
  prezentator: 'Dedicație citită de prezentator',
};

// Descriere implicita, folosita cat timp Tarif.descriere e gol (Sarcina V4-G).
// ecran si stream actualizate — dedicatia "in sala" apare acum si pe
// overlay-ul de streaming (migratia 0021_unificare_ecran_stream.sql).
export const DESCRIERE_IMPLICITA: Record<TipDedicatie, string> = {
  sustinere: 'Fără mesaj afișat',
  ecran: 'Apare pe ecranele din sală și în transmisiunea live',
  stream: 'Apare doar pe transmisiunea live',
  prezentator: 'Citită live, în timpul show-ului',
};

export function lei(bani: number): string {
  return (bani / 100).toLocaleString('ro-RO') + ' lei';
}
