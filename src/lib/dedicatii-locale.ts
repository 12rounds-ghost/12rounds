// Sarcina E, Pasul 6: emailul fiind optional, linkul /status/[id] se poate
// pierde daca clientul inchide tabul. Pastram un istoric local ca sa poata
// fi regasit din acelasi browser, fara cont.
const CHEIE = '12rounds_dedicatii';
const MAX_INTRARI = 20;

export interface DedicatieLocala {
  id: string;
  event_slug: string;
  data: string; // ISO
}

export function salveazaDedicatieLocala(intrare: Omit<DedicatieLocala, 'data'>): void {
  if (typeof window === 'undefined') return;
  try {
    const existente = obtineDedicatiiLocale().filter((d) => d.id !== intrare.id);
    const actualizate = [{ ...intrare, data: new Date().toISOString() }, ...existente].slice(0, MAX_INTRARI);
    window.localStorage.setItem(CHEIE, JSON.stringify(actualizate));
  } catch {
    // localStorage poate fi indisponibil (mod privat, cotă depășită) — nu blocăm plata pentru atât.
  }
}

export function obtineDedicatiiLocale(): DedicatieLocala[] {
  if (typeof window === 'undefined') return [];
  try {
    const brut = window.localStorage.getItem(CHEIE);
    if (!brut) return [];
    const parsat = JSON.parse(brut);
    return Array.isArray(parsat) ? parsat : [];
  } catch {
    return [];
  }
}
