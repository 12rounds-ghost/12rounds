'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const CHEIE = '12rounds_cookie_consent';

type Consimtamant = 'acceptat' | 'refuzat' | null;

// Sarcina: GDPR afisat — banner de cookie-uri, obligatoriu inainte sa
// pornim Google Analytics (GoogleAnalytics.tsx nu se randeaza deloc pana la
// "Accept"). Pastram alegerea in localStorage — per dispozitiv/browser, nu
// se sincronizeaza intre viizitatori si nu ajunge la noi (e o comoditate
// locala, nu o evidenta legala a consimtamantului).
export function CookieConsent({ tagId }: { tagId: string }) {
  const pathname = usePathname();
  const [consimtamant, setConsimtamant] = useState<Consimtamant>(null);
  const [gata, setGata] = useState(false);

  useEffect(() => {
    try {
      const salvat = window.localStorage.getItem(CHEIE);
      if (salvat === 'acceptat' || salvat === 'refuzat') setConsimtamant(salvat);
    } catch {
      // localStorage indisponibil (mod privat etc.) — banner-ul ramane vizibil.
    }
    setGata(true);
  }, []);

  function alege(valoare: 'acceptat' | 'refuzat') {
    setConsimtamant(valoare);
    try {
      window.localStorage.setItem(CHEIE, valoare);
    } catch {
      // ignorat — alegerea tot se aplica pentru sesiunea curenta
    }
  }

  // Fara kiosk-uri/OBS — la fel ca GoogleAnalytics.tsx.
  const ascuns = pathname?.startsWith('/ecran') || pathname?.startsWith('/overlay');

  return (
    <>
      {consimtamant === 'acceptat' && <GoogleAnalytics tagId={tagId} />}

      {gata && !ascuns && !consimtamant && (
        <div className="cookie-banner" role="dialog" aria-label="Cookie-uri">
          <p>
            Folosim cookie-uri pentru statistici de vizitare (Google Analytics), ca să înțelegem cum este
            folosit site-ul. Detalii în{' '}
            <Link href="/confidentialitate#gdpr">Politica de confidențialitate</Link>.
          </p>
          <div className="cookie-banner-actii">
            <button className="btn secondary mic" onClick={() => alege('refuzat')}>Refuz</button>
            <button className="btn ok mic" onClick={() => alege('acceptat')}>Accept</button>
          </div>
        </div>
      )}
    </>
  );
}
