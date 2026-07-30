import { NUME_TIP, type TipDedicatie } from './types';

// Trimite emailul de confirmare cu linkul de status, dupa ce plata a fost
// marcata 'paid'. Foloseste Resend prin fetch direct (fara SDK, o dependenta
// in plus nu e necesara pentru un singur apel POST).
// Daca RESEND_API_KEY lipseste, iesim tacut — plata nu trebuie sa esueze
// din cauza emailului.
export async function trimiteEmailConfirmare(params: {
  email: string;
  dedicatieId: string;
  tip: TipDedicatie;
  pentru: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://12rounds.ro';
  const link = `${siteUrl}/status/${params.dedicatieId}`;
  const rezumat = params.pentru
    ? `${NUME_TIP[params.tip]} pentru ${params.pentru}`
    : NUME_TIP[params.tip];

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // schimba adresa cand domeniul 12rounds.ro e verificat in Resend
        from: '12 ROUNDS <onboarding@resend.dev>',
        to: params.email,
        subject: 'Mulțumim pentru dedicație — 12 ROUNDS',
        html: `
          <p>Mulțumim pentru susținere!</p>
          <p>Dedicația ta: <strong>${rezumat}</strong></p>
          <p>Urmărește statusul ei aici: <a href="${link}">${link}</a></p>
          <p>12 ROUNDS — The Battle of the Bands</p>
        `,
      }),
    });
    if (!res.ok) {
      console.error('Resend a răspuns cu eroare', res.status, await res.text());
    }
  } catch (e) {
    console.error('Trimiterea emailului de confirmare a eșuat', e);
  }
}
