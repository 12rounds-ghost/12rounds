'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Ecran } from '@/lib/types';

const ONLINE_PRAG_MS = 15_000;

function genereazaToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Sarcina V4-C (IMPLEMENTARE-V4.md): ecranele sunt acum entitati
// administrabile, fiecare cu tokenul lui — nu mai exista limita de trei,
// iar un token compromis se regenereaza individual, fara sa afecteze
// celelalte ecrane.
export function EcraneClient({ siteUrl }: { siteUrl: string }) {
  const [ecrane, setEcrane] = useState<Ecran[]>([]);
  const [dedicatiiCurente, setDedicatiiCurente] = useState<Record<string, { mesaj: string | null; de_la: string | null }>>({});
  const [acum, setAcum] = useState(Date.now());
  const [seAdauga, setSeAdauga] = useState(false);
  const [copiat, setCopiat] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data } = await sb.from('ecrane').select('*').order('ordine', { ascending: true });
    const lista = (data ?? []) as Ecran[];
    setEcrane(lista);

    const idDedicatii = lista.map((e) => e.ultima_dedicatie_id).filter((id): id is string => !!id);
    if (idDedicatii.length > 0) {
      const { data: ded } = await sb.from('dedicatii').select('id, mesaj, de_la').in('id', idDedicatii);
      const map: Record<string, { mesaj: string | null; de_la: string | null }> = {};
      for (const d of ded ?? []) map[d.id] = { mesaj: d.mesaj, de_la: d.de_la };
      setDedicatiiCurente(map);
    }
  }, []);

  useEffect(() => {
    incarca();
    const sb = supabaseBrowser();
    const canal = sb
      .channel('ecrane')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ecrane' }, incarca)
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [incarca]);

  // "Online" nu vine dintr-un semnal push — recalculam periodic fata de
  // ultima_cerere, ca sa nu ramana un ecran deconectat marcat verde la nesfarsit.
  useEffect(() => {
    const interval = setInterval(() => setAcum(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  async function adaugaEcran() {
    setSeAdauga(true);
    const sb = supabaseBrowser();
    await sb.from('ecrane').insert({ nume: `Ecran ${ecrane.length + 1}`, ordine: ecrane.length });
    setSeAdauga(false);
  }

  async function comutaActiv(ecran: Ecran) {
    await supabaseBrowser().from('ecrane').update({ activ: !ecran.activ }).eq('id', ecran.id);
  }

  async function redenumeste(ecran: Ecran) {
    const nume = window.prompt('Nume ecran (ex: „Bar", „Scenă stânga"):', ecran.nume);
    if (nume === null || !nume.trim()) return;
    await supabaseBrowser().from('ecrane').update({ nume: nume.trim() }).eq('id', ecran.id);
  }

  async function sterge(ecran: Ecran) {
    if (!window.confirm(`Ștergi ecranul „${ecran.nume}"? Link-ul lui nu va mai funcționa.`)) return;
    await supabaseBrowser().from('ecrane').delete().eq('id', ecran.id);
  }

  async function regenereazaToken(ecran: Ecran) {
    if (!window.confirm('Linkul vechi al acestui ecran nu va mai funcționa după regenerare. Continui?')) return;
    await supabaseBrowser().from('ecrane').update({ token: genereazaToken() }).eq('id', ecran.id);
  }

  function urlEcran(ecran: Ecran) {
    return `${siteUrl}/ecran/${ecran.id}?key=${ecran.token}`;
  }

  function copiazaUrl(ecran: Ecran) {
    navigator.clipboard.writeText(urlEcran(ecran));
    setCopiat(ecran.id);
    setTimeout(() => setCopiat(null), 2000);
  }

  return (
    <div>
      <h1>Ecrane</h1>
      <p className="sub">
        Ecranele din sală rotesc automat dedicațiile aprobate, fără operator. Fiecare ecran are
        propriul link, cu token unic — nu-l trimite decât dispozitivului care afișează pe el.
      </p>

      <div style={{ marginTop: 12 }}>
        <button className="btn secondary mic" onClick={adaugaEcran} disabled={seAdauga}>
          {seAdauga ? 'Se adaugă…' : '+ Adaugă ecran'}
        </button>
      </div>

      {ecrane.length === 0 && <div className="card">Niciun ecran configurat încă.</div>}

      {ecrane.map((ecran) => {
        const online = ecran.ultima_cerere ? acum - new Date(ecran.ultima_cerere).getTime() < ONLINE_PRAG_MS : false;
        const curenta = ecran.ultima_dedicatie_id ? dedicatiiCurente[ecran.ultima_dedicatie_id] : null;
        return (
          <div key={ecran.id} className="card mesaj-card">
            <div className="meta">
              <span className={`badge ${online ? 'ok' : ''}`}>{online ? '● online' : '○ offline'}</span>{' '}
              <span className="badge gold">{ecran.nume}</span>{' '}
              {!ecran.activ && <span className="badge warn">dezactivat</span>}
            </div>
            {curenta && (
              <div className="text" style={{ fontSize: 14 }}>
                Acum: „{curenta.mesaj}”{curenta.de_la ? ` — ${curenta.de_la}` : ''}
              </div>
            )}
            <div className="sub" style={{ textAlign: 'left', wordBreak: 'break-all', margin: '6px 0' }}>
              {urlEcran(ecran)}
            </div>
            <div className="rand" style={{ justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn secondary mic" onClick={() => copiazaUrl(ecran)}>
                {copiat === ecran.id ? '✓ Copiat' : 'Copiază link'}
              </button>
              <button className="btn secondary mic" onClick={() => redenumeste(ecran)}>Redenumește</button>
              <button className={`btn mic ${ecran.activ ? 'danger' : 'ok'}`} onClick={() => comutaActiv(ecran)}>
                {ecran.activ ? 'Dezactivează' : 'Activează'}
              </button>
              <button className="btn secondary mic" onClick={() => regenereazaToken(ecran)}>Regenerează token</button>
              <button className="btn danger mic" onClick={() => sterge(ecran)}>Șterge</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
