'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { SetariSite } from '@/lib/types';

// Sarcina: zona de admin pentru Google Tag (Google Analytics) si comutatorul
// de acces la site — un singur rand de setari globale (setari_site,
// migratiile 0026/0029). GoogleAnalytics.tsx citeste tag-ul in layout-ul de
// site si sare peste /ecran si /overlay; src/middleware.ts citeste
// site_public la fiecare cerere (cu cache de 15s).
export function SetariClient({ setariInitiale }: { setariInitiale: SetariSite | null }) {
  const [googleTagId, setGoogleTagId] = useState(setariInitiale?.google_tag_id ?? '');
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [salvatLa, setSalvatLa] = useState<number | null>(null);
  const [eroare, setEroare] = useState('');

  const [sitePublic, setSitePublic] = useState(setariInitiale?.site_public ?? false);
  const [seSalveazaAcces, setSeSalveazaAcces] = useState(false);
  const [eroareAcces, setEroareAcces] = useState('');

  async function schimbaAccesSite(nou: boolean) {
    const mesaj = nou
      ? 'Faci site-ul public? Oricine îl poate vedea, fără parolă. Efectul apare pentru vizitatori în cel mult 15 secunde.'
      : 'Pui parola la loc? Vizitatorii vor vedea din nou pagina „Revenim în curând" până introduc parola.';
    if (!window.confirm(mesaj)) return;
    setSeSalveazaAcces(true);
    setEroareAcces('');
    const { error } = await supabaseBrowser()
      .from('setari_site')
      .update({ site_public: nou, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSeSalveazaAcces(false);
    if (error) {
      setEroareAcces('Nu am putut salva. Încearcă din nou.');
      return;
    }
    setSitePublic(nou);
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare('');
    const valoare = googleTagId.trim();
    const { error } = await supabaseBrowser()
      .from('setari_site')
      .update({ google_tag_id: valoare || null, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSeSalveaza(false);
    if (error) {
      setEroare('Nu am putut salva. Încearcă din nou.');
      return;
    }
    setSalvatLa(Date.now());
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Setări</h1>
      <p className="sub">Configurări globale ale site-ului, indiferent de ediție.</p>

      <div className="card">
        <div className="rand">
          <span>
            Acces la site: <strong>{sitePublic ? 'public (fără parolă)' : 'protejat — „Revenim în curând"'}</strong>
          </span>
          <button
            className={`btn ${sitePublic ? 'secondary' : 'ok'} mic`}
            disabled={seSalveazaAcces}
            onClick={() => schimbaAccesSite(!sitePublic)}
          >
            {seSalveazaAcces ? 'Se salvează…' : sitePublic ? 'Pune parola la loc' : 'Scoate „Revenim în curând"'}
          </button>
        </div>
        <p className="sub" style={{ textAlign: 'left', margin: '10px 0 0' }}>
          {sitePublic
            ? 'Site-ul e vizibil pentru oricine, fără parolă. „Pune parola la loc” arată din nou „Revenim în curând” tuturor vizitatorilor fără cookie-ul de acces.'
            : 'Tot site-ul e blocat cu parolă (pagina „Revenim în curând”), în afară de ecranele din sală, transmisiunea live și webhook-ul Stripe, care rămân libere oricând.'}
        </p>
        <p className="sub" style={{ textAlign: 'left', margin: '6px 0 0' }}>
          Efectul unei schimbări ajunge la vizitatori în cel mult 15 secunde.
        </p>
        {eroareAcces && <p className="eroare" style={{ margin: '8px 0 0' }}>{eroareAcces}</p>}
      </div>

      <div className="card">
        <label htmlFor="tagid">Google Tag ID</label>
        <input
          id="tagid"
          value={googleTagId}
          onChange={(e) => setGoogleTagId(e.target.value)}
          placeholder="G-XXXXXXXXXX"
        />
        <p className="sub" style={{ margin: '8px 0 16px' }}>
          Din Google Analytics (Admin → Data Streams → tag-ul „G-...” sau „AW-...”). Se încarcă automat pe tot
          site-ul public — nu și pe ecranele din sală sau pe transmisiunea live. Lasă gol ca să oprești Analytics.
        </p>
        <div className="rand" style={{ width: 'auto', gap: 10 }}>
          <button className="btn ok mic" disabled={seSalveaza} onClick={salveaza}>
            {seSalveaza ? 'Se salvează…' : 'Salvează'}
          </button>
          {salvatLa && <span className="sub" style={{ margin: 0 }}>Salvat.</span>}
          {eroare && <span className="sub" style={{ margin: 0, color: 'var(--accent)' }}>{eroare}</span>}
        </div>
      </div>
    </div>
  );
}
