import { urlSponsorLogo } from '@/lib/storage';
import type { Sponsor } from '@/lib/types';

function SponsorItem({ sponsor }: { sponsor: Sponsor }) {
  const conținut = sponsor.logo_path ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={urlSponsorLogo(sponsor.logo_path)} alt={sponsor.nume} />
  ) : (
    <span>{sponsor.nume}</span>
  );
  if (sponsor.url) {
    return (
      <a href={sponsor.url} target="_blank" rel="noopener sponsored" className="sponsor-item">
        {conținut}
      </a>
    );
  }
  return <div className="sponsor-item">{conținut}</div>;
}

// Sectiunea de sponsori — dispare complet daca nu exista niciunul activ
// (Sarcina A, criteriu de acceptanta: nicio sectiune goala fara explicatie).
export function SponsoriSection({ sponsori }: { sponsori: Sponsor[] }) {
  if (sponsori.length === 0) return null;

  const principali = sponsori.filter((s) => s.nivel === 'principal');
  const sustinatori = sponsori.filter((s) => s.nivel === 'sustinator');

  return (
    <>
      {principali.length > 0 && (
        <>
          <div className="tier-label">Parteneri principali</div>
          <div className="sponsors" style={{ gridTemplateColumns: `repeat(${Math.min(principali.length, 3)}, 1fr)` }}>
            {principali.map((s) => (
              <SponsorItem key={s.id} sponsor={s} />
            ))}
          </div>
        </>
      )}
      {sustinatori.length > 0 && (
        <>
          <div className="tier-label">Susținători</div>
          <div className="sponsors">
            {sustinatori.map((s) => (
              <SponsorItem key={s.id} sponsor={s} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
