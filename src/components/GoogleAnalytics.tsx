'use client';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

// Sarcina: integrare Google Analytics, cu tag-ul editabil din admin (Setări).
// Sarim peste kiosk-uri (/ecran) si Browser Source-urile OBS (/overlay) —
// ruleaza neatent, ore in sir, pe conexiuni de sala variabile; n-are cine sa
// "vada" analytics acolo, iar cererile in plus nu ajuta nimic.
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
          gtag('js', new Date());
          gtag('config', '${tagId}');
        `}
      </Script>
    </>
  );
}
