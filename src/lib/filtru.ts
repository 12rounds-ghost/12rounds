import { CUVINTE_INTERZISE } from './cuvinte-interzise';

export interface RezultatFiltru {
  curat: boolean;
  motive: string[];
}

const PRAG_MAJUSCULE = 0.7;
const REGEX_LINK = /(https?:\/\/|www\.|\S+\.(ro|com|net|org|io))/i;
const REGEX_TELEFON = /(\+?\d[\d\s.\-]{7,}\d)/;

function faraDiacritice(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function contineCuvantInterzis(text: string): boolean {
  const normalizat = faraDiacritice(text);
  return CUVINTE_INTERZISE.some((cuvant) => new RegExp(`\\b${cuvant}\\w*`, 'i').test(normalizat));
}

function procentMajuscule(text: string): number {
  const litere = text.replace(/[^a-zA-ZăâîșțĂÂÎȘȚ]/g, '');
  if (litere.length < 10) return 0; // mesajele scurte nu se judeca dupa procent
  const majuscule = litere.replace(/[^A-ZĂÂÎȘȚ]/g, '');
  return majuscule.length / litere.length;
}

// Verifica un mesaj de dedicatie inainte de a intra in coada de moderare.
// - 'limbaj_nepotrivit' e singurul motiv care blocheaza plata (curat = false).
// - 'majuscule' / 'link' / 'telefon' sunt doar suspiciuni: mesajul trece mai
//   departe, dar apare cu un semn de avertizare in /admin/moderare.
export function verificaMesaj(text: string): RezultatFiltru {
  const motive: string[] = [];

  if (contineCuvantInterzis(text)) motive.push('limbaj_nepotrivit');
  if (procentMajuscule(text) > PRAG_MAJUSCULE) motive.push('majuscule');
  if (REGEX_LINK.test(text)) motive.push('link');
  if (REGEX_TELEFON.test(text)) motive.push('telefon');

  return { curat: !motive.includes('limbaj_nepotrivit'), motive };
}

export const MESAJ_MOTIV: Record<string, string> = {
  limbaj_nepotrivit: 'Limbaj nepotrivit',
  majuscule: 'Foarte multe majuscule',
  link: 'Conține un link',
  telefon: 'Conține un număr de telefon',
};
