'use client';
import { useEffect, useState } from 'react';

// Sarcina: iconita de play peste posterul din hero, care deschide un popup
// cu playerul YouTube. Randata peste imagine, in interiorul <Link> catre
// pagina editiei (poster-stage) — de-asta preventDefault/stopPropagation pe
// click, altfel butonul ar naviga in loc sa deschida popup-ul.
export function HeroVideoButon({ youtubeId }: { youtubeId: string }) {
  const [deschis, setDeschis] = useState(false);

  useEffect(() => {
    if (!deschis) return;
    function peEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setDeschis(false);
    }
    document.addEventListener('keydown', peEsc);
    return () => document.removeEventListener('keydown', peEsc);
  }, [deschis]);

  return (
    <>
      <button
        type="button"
        aria-label="Vezi trailerul"
        className="hero-play-buton"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDeschis(true);
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {deschis && (
        <div
          className="hero-video-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDeschis(false);
          }}
        >
          <div className="hero-video-frame" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Închide"
              className="hero-video-close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeschis(false);
              }}
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title="12 ROUNDS — trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
