'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { EcranConfig } from '@/lib/types';

const ONLINE_PRAG_MS = 30_000;

export function EcraneClient({ ecranSecret, siteUrl }: { ecranSecret: string; siteUrl: string }) {
  const [ecrane, setEcrane] = useState<EcranConfig[]>([]);
  const [nrNou, setNrNou] = useState('');
  const [acum, setAcum] = useState(Date.now());

  const incarca = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data } = await sb.from('ecrane_config').select('*').order('nr', { ascending: true });
    setEcrane((data ?? []) as EcranConfig[]);
  }, []);

  useEffect(() => {
    incarca();
    const sb = supabaseBrowser();
    const canal = sb
      .channel('ecrane-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ecrane_config' }, incarca)
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [incarca]);

  // "Online" nu vine dintr-un semnal push — recalculam periodic fata de
  // ultima_conectare, ca sa nu ramana un ecran deconectat marcat verde la nesfarsit.
  useEffect(() => {
    const interval = setInterval(() => setAcum(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  async function adaugaEcran() {
    const nr = Number(nrNou);
    if (!Number.isInteger(nr) || nr <= 0) return;
    const sb = supabaseBrowser();
    await sb.from('ecrane_config').insert({ nr, activ: true });
    setNrNou('');
  }

  async function comutaActiv(ecran: EcranConfig) {
    const sb = supabaseBrowser();
    await sb.from('ecrane_config').update({ activ: !ecran.activ }).eq('nr', ecran.nr);
  }

  async function redenumeste(ecran: EcranConfig) {
    const nume = window.prompt('Nume ecran (ex: „Bar", „Scenă stânga"):', ecran.nume ?? '');
    if (nume === null) return;
    const sb = supabaseBrowser();
    await sb.from('ecrane_config').update({ nume: nume.trim() || null }).eq('nr', ecran.nr);
  }

  async function sterge(ecran: EcranConfig) {
    if (!window.confirm(`Ștergi configurarea ecranului ${ecran.nr}?`)) return;
    const sb = supabaseBrowser();
    await sb.from('ecrane_config').delete().eq('nr', ecran.nr);
  }

  function copiazaUrl(nr: number) {
    const url = `${siteUrl}/ecran/${nr}?key=${ecranSecret}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div>
      <h1>Ecrane</h1>
      <p className="sub">
        Ecranele din sală rotesc automat dedicațiile aprobate, fără operator. Un ecran apare aici
        singur de îndată ce e deschis cu link-ul lui — sau îl poți adăuga dinainte, mai jos.
      </p>

      {!ecranSecret && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          Lipsește <code>ECRAN_SECRET</code> din variabilele de mediu — ecranele nu vor funcționa
          până nu îl setezi.
        </div>
      )}

      <div className="card rand" style={{ gap: 10 }}>
        <input
          value={nrNou}
          onChange={(e) => setNrNou(e.target.value)}
          placeholder="Nr. ecran (ex: 1)"
          inputMode="numeric"
          style={{ maxWidth: 160 }}
        />
        <button className="btn secondary mic" onClick={adaugaEcran}>+ Adaugă ecran</button>
      </div>

      {ecrane.length === 0 && <div className="card">Niciun ecran configurat încă.</div>}

      {ecrane.map((ecran) => {
        const online = ecran.ultima_conectare ? acum - new Date(ecran.ultima_conectare).getTime() < ONLINE_PRAG_MS : false;
        return (
          <div key={ecran.nr} className="card mesaj-card">
            <div className="meta">
              <span className={`badge ${online ? 'ok' : ''}`}>{online ? '● online' : '○ offline'}</span>{' '}
              <span className="badge gold">Ecran {ecran.nr}</span>{' '}
              {!ecran.activ && <span className="badge warn">dezactivat</span>}
            </div>
            <div className="text">{ecran.nume || <span className="sub">fără nume</span>}</div>
            {ecranSecret && (
              <div className="sub" style={{ textAlign: 'left', wordBreak: 'break-all', margin: '6px 0' }}>
                {siteUrl}/ecran/{ecran.nr}?key=••••••••
              </div>
            )}
            <div className="rand" style={{ justifyContent: 'flex-start', gap: 8 }}>
              {ecranSecret && (
                <button className="btn secondary mic" onClick={() => copiazaUrl(ecran.nr)}>
                  Copiază link
                </button>
              )}
              <button className="btn secondary mic" onClick={() => redenumeste(ecran)}>Redenumește</button>
              <button className={`btn mic ${ecran.activ ? 'danger' : 'ok'}`} onClick={() => comutaActiv(ecran)}>
                {ecran.activ ? 'Dezactivează' : 'Activează'}
              </button>
              <button className="btn secondary mic" onClick={() => sterge(ecran)}>Șterge</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
