'use client';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const CHEIE_CONSIMTAMANT = '12rounds_cookie_consent';

// Sarcina: integrare Google Analytics, cu tag-ul editabil din admin (Setări).
// Sarim peste kiosk-uri (/ecran) si Browser Source-urile OBS (/overlay) —
// ruleaza neatent, ore in sir, pe conexiuni de sala variabile; n-are cine sa
// "vada" analytics acolo, iar cererile in plus nu ajuta nimic.
//
// Google Consent Mode v2 (Sarcina: "Your Google tag wasn't detected" —
// verificatorul Google viziteaza pagina fara sa apese "Accept" pe banner-ul
// de cookie-uri, deci scriptul nu pornea NICIODATA pentru el, la fel ca
// pentru orice vizitator care n-a raspuns inca la banner). Solutia corecta
// nu e sa incarcam scriptul neconditionat (ar insemna cookie-uri de tracking
// fara consimtamant, exact ce banner-ul trebuia sa previna) — e ca tag-ul sa
// fie mereu prezent si sa trimita un semnal "fara cookie-uri" cat timp
// consimtamantul e 'denied' (asta detecteaza Google), dar sa nu scrie nimic
// persistent (cookie/localStorage de tracking) pana la accept explicit.
// Cererea initiala de consimtamant vine chiar din acest script, citind
// direct localStorage (nu din React state — trebuie sa fie primul lucru
// care ruleaza, inainte de gtag('config',...), altfel exista o fereastra in
// care am trimite un semnal implicit 'granted'). CookieConsent.tsx doar
// actualizeaza consimtamantul ulterior (gtag('consent','update',...)), nu
// mai monteaza/demonteaza acest component.
export function GoogleAnalytics({ tagId }: { tagId: string }) {
  const pathname = usePathname();
  if (!tagId || pathname?.startsWith('/ecran') || pathname?.startsWith('/overlay')) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`} strategy="afterInteractive" />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var consimtamant;
          try { consimtamant = localStorage.getItem('${CHEIE_CONSIMTAMANT}'); } catch (e) {}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: consimtamant === 'acceptat' ? 'granted' : 'denied',
          });
          gtag('js', new Date());
          gtag('config', '${tagId}');
        `}
      </Script>
    </>
  );
}
