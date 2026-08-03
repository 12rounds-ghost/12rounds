import { supabaseAdmin } from './supabase/admin';
import { NUME_TIP, type TipDedicatie } from './types';

// Trimite emailul de confirmare cu linkul de status, dupa ce plata a fost
// marcata 'paid'. Foloseste Resend prin fetch direct (fara SDK, o dependenta
// in plus nu e necesara pentru un singur apel POST).
// Daca RESEND_API_KEY lipseste, iesim tacut — plata nu trebuie sa esueze
// din cauza emailului. Rezultatul (succes/eroare) se scrie mereu pe
// dedicatie (Sarcina G, IMPLEMENTARE-V3.md), ca esecurile sa fie vizibile
// in /admin/dedicatii in loc sa dispara tacut intr-un log.
export async function trimiteEmailConfirmare(params: {
  email: string;
  dedicatieId: string;
  tip: TipDedicatie;
  pentru: string | null;
  deLa: string | null;
  mesaj: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://12rounds.ro';
  const link = `${siteUrl}/status/${params.dedicatieId}`;
  const logoUrl = `${siteUrl}/logo.jpeg`;
  const rezumat = params.pentru
    ? `${NUME_TIP[params.tip]} pentru ${params.pentru}`
    : NUME_TIP[params.tip];

  const sb = supabaseAdmin();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // RESEND_FROM_EMAIL se seteaza dupa ce domeniul e verificat in Resend
        // (vezi Sarcina G) — pana atunci, sandbox-ul Resend accepta doar
        // adresa contului.
        from: process.env.RESEND_FROM_EMAIL ?? '12 ROUNDS <onboarding@resend.dev>',
        to: params.email,
        subject: 'Mulțumim pentru dedicație — 12 ROUNDS',
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 480px;">
            <img src="${logoUrl}" alt="12 ROUNDS" width="64" height="64" style="border-radius:50%;margin-bottom:16px" />
            <p>Mulțumim pentru susținere!</p>
            <p><strong>${rezumat}</strong></p>
            ${params.deLa ? `<p>De la: ${params.deLa}</p>` : ''}
            ${params.mesaj ? `<p>Mesajul tău: „${params.mesaj}”</p>` : ''}
            <p>Urmărește statusul dedicației tale aici: <a href="${link}">${link}</a></p>
            <p style="color:#6b6b73;font-size:13px">Mesajul apare pe ecranele din sală, după aprobarea moderatorului — nu în transmisiunile online.</p>
            <p>12 ROUNDS — The Battle of the Bands</p>
          </div>
        `,
        text: [
          'Mulțumim pentru susținere!',
          rezumat,
          params.deLa ? `De la: ${params.deLa}` : null,
          params.mesaj ? `Mesajul tău: „${params.mesaj}”` : null,
          `Urmărește statusul dedicației tale aici: ${link}`,
          'Mesajul apare pe ecranele din sală, după aprobarea moderatorului — nu în transmisiunile online.',
          '12 ROUNDS — The Battle of the Bands',
        ]
          .filter(Boolean)
          .join('\n\n'),
      }),
    });

    if (!res.ok) {
      const detaliu = await res.text();
      console.error('Resend a răspuns cu eroare', res.status, detaliu);
      await sb
        .from('dedicatii')
        .update({ email_eroare: `HTTP ${res.status}: ${detaliu}`.slice(0, 500) })
        .eq('id', params.dedicatieId);
      return;
    }

    await sb
      .from('dedicatii')
      .update({ email_trimis_la: new Date().toISOString(), email_eroare: null })
      .eq('id', params.dedicatieId);
  } catch (e) {
    const mesajEroare = e instanceof Error ? e.message : 'Eroare necunoscută';
    console.error('Trimiterea emailului de confirmare a eșuat', e);
    await sb
      .from('dedicatii')
      .update({ email_eroare: mesajEroare.slice(0, 500) })
      .eq('id', params.dedicatieId);
  }
}
