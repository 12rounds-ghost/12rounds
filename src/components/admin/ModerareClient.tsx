'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { NUME_TIP, lei, type Dedicatie } from '@/lib/types';
import { verificaMesaj, MESAJ_MOTIV } from '@/lib/filtru';
import { SelectorEveniment } from '@/components/SelectorEveniment';

const CHEIE_SUNET = 'moderare_sunet';

function sunaNotificare() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // browsere care blocheaza audio fara interactiune anterioara — ignoram
  }
}

// Poza e inca in bucket-ul privat poze-in-verificare la acest stadiu (Sarcina
// B) — un URL semnat, valabil 1 ora, e singura cale de a o afisa aici.
function PozaInAsteptare({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let anulat = false;
    supabaseBrowser()
      .storage.from('poze-in-verificare')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!anulat && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      anulat = true;
    };
  }, [path]);

  if (!url) return <p className="sub" style={{ textAlign: 'left', margin: '6px 0' }}>Se încarcă poza…</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Poza dedicației, în așteptarea aprobării" className="poza-moderare-preview" />
  );
}

export function ModerareClient() {
  const [lista, setLista] = useState<Dedicatie[]>([]);
  const [eventId, setEventId] = useState('');
  const [sunetActivat, setSunetActivat] = useState(false);
  const sunetRef = useRef(false);
  const idPrecedenteRef = useRef<Set<string>>(new Set());
  const eventIdAnteriorRef = useRef('');

  useEffect(() => {
    setSunetActivat(localStorage.getItem(CHEIE_SUNET) === '1');
  }, []);

  useEffect(() => {
    sunetRef.current = sunetActivat;
  }, [sunetActivat]);

  function comutaSunet() {
    setSunetActivat((prev) => {
      const urmator = !prev;
      localStorage.setItem(CHEIE_SUNET, urmator ? '1' : '0');
      return urmator;
    });
  }

  const incarca = useCallback(async () => {
    // Rezervările pentru ediția următoare stau ascunse până când event-ul lor
    // devine live — dar acum operatorul poate alege orice ediție explicit
    // (SelectorEveniment, implicit cea live).
    if (!eventId) {
      setLista([]);
      return;
    }
    const sb = supabaseBrowser();
    const { data } = await sb
      .from('dedicatii')
      .select('*')
      .eq('event_id', eventId)
      .eq('status_plata', 'paid')
      .eq('status_moderare', 'in_verificare')
      .order('created_at', { ascending: true });
    const noua = (data ?? []) as Dedicatie[];

    // schimbarea editiei selectate nu trebuie sa sune ca si cum ar fi mesaje noi
    if (eventIdAnteriorRef.current !== eventId) {
      idPrecedenteRef.current = new Set();
      eventIdAnteriorRef.current = eventId;
    }

    // sunet doar la mesaje nou-sosite fata de incarcarea anterioara — nu la
    // deschiderea initiala a paginii, ca sa nu sune pentru coada deja existenta
    const idNoi = noua.map((d) => d.id);
    const auAparutNoutati = idPrecedenteRef.current.size > 0 && idNoi.some((id) => !idPrecedenteRef.current.has(id));
    if (auAparutNoutati && sunetRef.current) sunaNotificare();
    idPrecedenteRef.current = new Set(idNoi);

    setLista(noua);
  }, [eventId]);

  useEffect(() => {
    incarca();
    const sb = supabaseBrowser();
    const canal = sb
      .channel('moderare')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dedicatii' }, incarca)
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  }, [incarca]);

  async function decidePoza(d: Dedicatie, actiune: 'aproba' | 'exclude') {
    if (!d.poza_path) return;
    await fetch(`/api/admin/dedicatii/${d.id}/poza`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actiune }),
    });
  }

  async function aproba(d: Dedicatie, cuPoza: boolean) {
    const sb = supabaseBrowser();
    const { data: sesiune } = await sb.auth.getUser();
    await sb
      .from('dedicatii')
      .update({ status_moderare: 'aprobat', moderator_id: sesiune.user?.id })
      .eq('id', d.id);
    if (d.poza_path) await decidePoza(d, cuPoza ? 'aproba' : 'exclude');
  }

  async function respinge(d: Dedicatie) {
    const sb = supabaseBrowser();
    const { data: sesiune } = await sb.auth.getUser();
    const motiv = window.prompt('Motivul respingerii (îl vede clientul):') ?? '';
    await sb
      .from('dedicatii')
      .update({ status_moderare: 'respins', motiv_respingere: motiv, moderator_id: sesiune.user?.id })
      .eq('id', d.id);
    if (d.poza_path) await decidePoza(d, 'exclude');
    if (window.confirm('Trimiți și rambursarea acum?')) {
      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dedicatie_id: d.id }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Rambursarea a eșuat.' }));
        alert(error === 'Fără drepturi' ? 'Doar rolul admin poate rambursa. Anunță un admin.' : error);
      }
    }
  }

  return (
    <div>
      <h1>Moderare</h1>
      <p className="sub">Mesaje plătite care așteaptă verificarea. Lista se actualizează singură.</p>
      <SelectorEveniment eventId={eventId} onChange={setEventId} />
      <label className="comutator-sunet">
        <input type="checkbox" checked={sunetActivat} onChange={comutaSunet} />
        🔔 Sunet la mesaje noi
      </label>
      {lista.length === 0 && <div className="card">Nimic de moderat momentan. 🎤</div>}
      {lista.map((d) => {
        const suspiciuni = verificaMesaj(d.mesaj ?? '').motive.filter((m) => m !== 'limbaj_nepotrivit');
        return (
        <div key={d.id} className="card mesaj-card">
          <div className="meta">
            <span className="badge gold">{NUME_TIP[d.tip]}</span>{' '}
            <span className="badge">{lei(d.suma_bani)}</span>{' '}
            <span className="badge">{d.sursa_platforma}</span>{' '}
            {suspiciuni.map((m) => (
              <span key={m} className="badge warn">⚠ {MESAJ_MOTIV[m] ?? m}</span>
            ))}
          </div>
          <div className="text">„{d.mesaj}”</div>
          <div className="meta">
            De la <strong>{d.de_la || '—'}</strong> pentru <strong>{d.pentru || '—'}</strong>
            {d.artist_preferat ? <> · artist: {d.artist_preferat}</> : null}
          </div>
          {d.poza_path && <PozaInAsteptare path={d.poza_path} />}
          <div className="rand">
            {d.poza_path ? (
              <>
                <button className="btn ok mic" onClick={() => aproba(d, true)}>Aprobă și poza</button>
                <button className="btn secondary mic" onClick={() => aproba(d, false)}>
                  Aprobă doar textul (fără poză)
                </button>
                <button className="btn danger mic" onClick={() => respinge(d)}>Respinge tot</button>
              </>
            ) : (
              <>
                <button className="btn ok mic" onClick={() => aproba(d, false)}>Aprobă</button>
                <button className="btn danger mic" onClick={() => respinge(d)}>Respinge</button>
              </>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
