import { redirect } from 'next/navigation';

// Inlocuit de /admin/evenimente/[id] (Sarcina D, IMPLEMENTARE-V2.md) — editor
// complet per eveniment, in loc de pagina veche legata de "ultimul eveniment".
export default function EditieRedirect() {
  redirect('/admin');
}
