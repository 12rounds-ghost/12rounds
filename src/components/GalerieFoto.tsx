'use client';
import { useEffect, useState } from 'react';
import { urlGalerie } from '@/lib/storage';
import type { PozaGalerie } from '@/lib/types';

// Grila de galerie cu lightbox (Sarcina C4) — click deschide imaginea mare,
// navigare cu tastatura (← → Esc).
export function GalerieFoto({ poze }: { poze: PozaGalerie[] }) {
  const [deschisIndex, setDeschisIndex] = useState<number | null>(null);

  useEffect(() => {
    if (deschisIndex === null) return;
    function laTasta(e: KeyboardEvent) {
      if (e.key === 'Escape') setDeschisIndex(null);
      if (e.key === 'ArrowRight') setDeschisIndex((i) => (i === null ? null : (i + 1) % poze.length));
      if (e.key === 'ArrowLeft') setDeschisIndex((i) => (i === null ? null : (i - 1 + poze.length) % poze.length));
    }
    document.addEventListener('keydown', laTasta);
    return () => document.removeEventListener('keydown', laTasta);
  }, [deschisIndex, poze.length]);

  if (poze.length === 0) return null;

  return (
    <>
      <div className="gal">
        {poze.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className="gal-item"
            style={{ backgroundImage: `url(${urlGalerie(p.path)})` }}
            onClick={() => setDeschisIndex(i)}
            aria-label={p.descriere ?? `Imagine ${i + 1}`}
          />
        ))}
      </div>

      {deschisIndex !== null && (
        <div className="lightbox" onClick={() => setDeschisIndex(null)}>
          <button className="lightbox-inchide" type="button" onClick={() => setDeschisIndex(null)} aria-label="Închide">✕</button>
          {poze.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              type="button"
              onClick={(e) => { e.stopPropagation(); setDeschisIndex((i) => (i === null ? null : (i - 1 + poze.length) % poze.length)); }}
              aria-label="Imaginea anterioară"
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlGalerie(poze[deschisIndex].path)}
            alt={poze[deschisIndex].descriere ?? ''}
            onClick={(e) => e.stopPropagation()}
          />
          {poze.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              type="button"
              onClick={(e) => { e.stopPropagation(); setDeschisIndex((i) => (i === null ? null : (i + 1) % poze.length)); }}
              aria-label="Imaginea următoare"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
