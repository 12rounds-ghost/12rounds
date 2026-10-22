'use client';
import { useRef } from 'react';

// Ghidul e un document HTML complet (stiluri proprii, cuprins, liste de
// verificare) — il izolam intr-un iframe ca stilurile lui sa nu se amestece cu
// cele ale adminului. Documentul vine de la /admin/ghid/document, care cere
// autentificare.
export function GhidViewer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function tipareste() {
    const cadru = iframeRef.current?.contentWindow;
    if (!cadru) return;
    cadru.focus();
    cadru.print();
  }

  return (
    <div>
      <div className="rand" style={{ marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Ghid de administrare</h1>
        <span className="rand" style={{ width: 'auto', gap: 8 }}>
          <button type="button" className="btn secondary mic" onClick={tipareste}>
            Tipărește / Salvează PDF
          </button>
          <a className="btn secondary mic" href="/admin/ghid/document" target="_blank" rel="noopener noreferrer">
            Deschide în pagină separată
          </a>
        </span>
      </div>
      <p className="sub">Ce face fiecare pagină din panou, cine are acces și cum arată traseul unei dedicații.</p>
      <iframe
        ref={iframeRef}
        src="/admin/ghid/document"
        title="Ghid de administrare 12 ROUNDS"
        style={{
          display: 'block',
          width: '100%',
          height: 'calc(100vh - 220px)',
          minHeight: 520,
          border: '1px solid #232323',
          borderRadius: 6,
          background: '#0b0b0b',
        }}
      />
    </div>
  );
}
