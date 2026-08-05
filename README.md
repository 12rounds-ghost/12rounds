# 12 ROUNDS — Platforma de dedicații (12rounds.ro)

Aplicație Next.js completă pentru fluxul: **QR/link → dedicație → plată (Apple Pay / Google Pay / card) → moderare → afișare în sală + streamuri**.

## Ce conține

| Rută | Rol |
|---|---|
| `/` | Pagina publică — formular dedicație când show-ul e live, mesaj „următorul show" când nu e |
| `/status/[id]` | Pagina clientului — cele 5 stări, actualizate în timp real |
| `/overlay` | Browser Source pentru OBS / vMix — afișează dedicația curentă (fundal transparent) |
| `/ecran/[id]` | Kiosk fullscreen pentru un ecran fizic din sală — rotește automat dedicațiile tip „ecran", fără operator |
| `/admin/moderare` | Coada de mesaje plătite: aprobă / respinge / refund |
| `/admin/regie` | Coada prezentatorului — doar dedicațiile citite cu voce tare (tip „prezentator") |
| `/admin/ecrane` | Vezi ecranele conectate, activează/dezactivează, copiază link-ul de kiosk |
| `/admin/event` | Toggle LIVE/încheiat, mesaje, linkuri stream |
| `/api/checkout` | Creează sesiunea Stripe Checkout |
| `/api/webhook` | Confirmarea plății de la Stripe |
| `/api/refund` | Rambursare (doar echipa) |

## Instalare pas cu pas

### 1. Supabase (baza de date)

1. Creează un proiect pe [supabase.com](https://supabase.com) (gratuit).
2. Deschide **SQL Editor → New query**, lipește conținutul din `supabase/migrations/0001_init.sql` și rulează-l. Se creează tabelele, politicile de securitate, realtime și o ediție pilot cu tarifele 25 / 75 / 250 lei.
3. **Authentication → Users → Add user** — creează conturile echipei (email + parolă).
4. Rulează în SQL Editor, pentru fiecare membru:
   ```sql
   insert into public.moderatori (id, email, rol)
   select id, email, 'admin' from auth.users where email = 'adresa@ta.ro';
   ```
5. Din **Project Settings → API** copiază `URL`, `anon key` și `service_role key`.

### 2. Stripe (plăți)

1. Cont pe [stripe.com](https://stripe.com) — pentru încasări reale ai nevoie de firmă (SRL/PFA) și activarea contului.
2. **Developers → API keys** → copiază `Secret key` (începe cu `sk_test_` în modul de test).
3. Webhook: **Developers → Webhooks → Add endpoint** cu URL-ul `https://domeniul-tau.ro/api/webhook` și evenimentul `checkout.session.completed`. Copiază `Signing secret` (`whsec_...`).
   - Local, folosește Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`
4. Apple Pay pe domeniul tău: **Settings → Payment methods → Apple Pay → Add domain** (Stripe Checkout îl activează automat după verificare). Google Pay merge din prima.

### 3. Rulare locală

```bash
cp .env.example .env.local   # completează cheile de mai sus
npm install
npm run dev                   # http://localhost:3000
```

Testează plata cu cardul de test Stripe: `4242 4242 4242 4242`, orice dată viitoare, orice CVC.

### 4. Publicare (Vercel)

1. Urcă proiectul pe GitHub, importă-l în [vercel.com](https://vercel.com).
2. Adaugă variabilele din `.env.example` în **Settings → Environment Variables**.
3. Setează `NEXT_PUBLIC_SITE_URL=https://12rounds.ro` și leagă domeniul.
4. Actualizează URL-ul webhook-ului în Stripe cu domeniul final.

### 5. Configurare pentru show

- QR-ul static duce la `https://12rounds.ro?src=qr`. Pentru fiecare platformă folosește linkuri cu sursă: `?src=tiktok`, `?src=youtube`, `?src=facebook`, `?src=instagram`, `?src=telegram` — așa știi de unde vin banii și clientul primește butonul corect „Înapoi la transmisiune".
- În `/admin/event` completează linkurile de stream (JSON) și pornește LIVE înainte de show.
- În OBS/vMix: **Add → Browser Source** cu `https://12rounds.ro/overlay`, 1920×1080. Aceeași scenă alimentează LED-urile din sală și transmisiile.

### 6. Configurare ecrane fizice din sală (Sarcina F, V4-C)

Dedicațiile tip „ecran" nu mai trec printr-un operator — fiecare ecran fizic din sală
(TV, tabletă, monitor) cere singur, automat, următoarea dedicație disponibilă și o
afișează câteva secunde, apoi trece la următoarea (sau, dacă nu mai e nimic nou, la
un cod QR / logo sponsor / branding, rotite în ordine fixă).

Ecranele sunt entități administrabile — nu mai există o limită de trei, iar fiecare
ecran are propriul token (nu unul global): dacă linkul unui ecran ajunge în mâini
greșite, îi regenerezi tokenul din `/admin/ecrane` fără să afectezi celelalte.

1. Din `/admin/ecrane` (cont admin) → **„+ Adaugă ecran"**. Se creează un rând nou,
   cu token generat automat, și îți arată imediat linkul complet cu buton de copiere.
2. Pe fiecare dispozitiv din sală, deschide linkul copiat într-un browser în mod
   fullscreen/kiosk — arată așa:
   ```
   https://12rounds.ro/ecran/<id-ul ecranului>?key=<tokenul lui>
   ```
3. Dezactivează screensaver-ul și sleep-ul dispozitivului (pe tabletă: "Ghid de acces"/
   "Guided Access" pe iOS, "Screen Pinning" pe Android — ține browserul fullscreen și
   blochează ieșirea accidentală).
4. Fără `?key=` corect (sau pentru un ecran șters), pagina rămâne complet neagră — nu
   există alt mesaj de eroare, intenționat (nu vrei să confirmi unui necunoscut că
   URL-ul e valid).
5. Ecranul nu ține nicio stare locală (fără `localStorage`) — poți reporni dispozitivul
   oricând în timpul show-ului, fără să rămână blocat într-o stare veche.
6. Opțional, `ECRAN_SECRET` din `.env.local` / Vercel (generat la fel ca
   `OVERLAY_SECRET`) mai funcționează ca o cheie universală de rezervă pe orice ecran —
   util într-o urgență, dar tokenul propriu al fiecărui ecran e calea normală.

## Fluxul în timpul show-ului

1. Spectatorul plătește → mesajul apare **instant** în `/admin/moderare`.
2. Moderatorul aprobă:
   - tip **„ecran"** → intră direct în coada ecranelor fizice, fără operator; primul
     ecran liber îl revendică și îl afișează automat (`/ecran/[id]`).
   - tip **„prezentator"** → apare în `/admin/regie`, unde prezentatorul/operatorul îl
     citește cu voce tare și îl marchează **„Citit"**.
3. Respins → **Refund** dintr-un click (banii se întorc automat).

## De îmbunătățit înainte de lansarea la scară (TODO)

- ~~Securitate citire dedicații~~ — rezolvat (Sarcina 1): tabela `dedicatii` se citește doar de echipă (`dedicatii_citire_echipa`, migrarea `0002_securizare_citire.sql`); pagina publică `/status/[id]` trece prin `src/app/api/status/[id]/route.ts` (service role, câmpuri limitate), iar `StatusTimeline` face polling la 5s în loc de realtime.
- **Filtru automat de limbaj** înaintea cozii de moderare.
- **Pagina de statistici** (`/admin/statistici`) — încasări per ediție / platformă / tip.
- **Rezervări pentru ediția următoare** când show-ul nu e live.
- **Pagini legale**: Termeni și condiții, Politica de rambursare, ANPC + SOL în footer — obligatorii pentru plăți online în România.
- **Email de confirmare** către client (Stripe trimite chitanța, dar un email cu linkul de status e util).
