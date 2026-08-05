'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { supabaseBrowser } from '@/lib/supabase/client';
import { urlCoperta, urlGalerie } from '@/lib/storage';
import { NUME_TIP, DESCRIERE_IMPLICITA, type Event, type Tarif, type TipDedicatie, type PozaGalerie } from '@/lib/types';

const TOATE_TIPURILE: TipDedicatie[] = ['sustinere', 'ecran', 'stream', 'prezentator'];

const PLATFORME_STREAM: { cheie: string; eticheta: string }[] = [
  { cheie: 'youtube', eticheta: 'YouTube' },
  { cheie: 'facebook', eticheta: 'Facebook' },
  { cheie: 'tiktok', eticheta: 'TikTok' },
  { cheie: 'instagram', eticheta: 'Instagram' },
  { cheie: 'telegram', eticheta: 'Telegram' },
];

const ETICHETA_STATUS: Record<Event['status'], string> = {
  live: 'live',
  upcoming: 'urmează',
  ended: 'încheiat',
};

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'eveniment'
  );
}

function laBani(lei: string): number {
  const n = Math.round(parseFloat(lei.replace(',', '.')) * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function EvenimentEditor({
  event,
  tarife: tarifeInitiale,
  galerieInitiala,
}: {
  event: Event;
  tarife: Tarif[];
  galerieInitiala: PozaGalerie[];
}) {
  const router = useRouter();
  const [nume, setNume] = useState(event.nume);
  const [subtitlu, setSubtitlu] = useState(event.subtitlu ?? '');
  const [slug, setSlug] = useState(event.slug);
  const [descriere, setDescriere] = useState(event.descriere ?? '');
  const [dataShow, setDataShow] = useState(event.data_show ? event.data_show.slice(0, 16) : '');
  const [locatie, setLocatie] = useState(event.locatie ?? '');
  const [artistA, setArtistA] = useState(event.artist_a ?? '');
  const [artistB, setArtistB] = useState(event.artist_b ?? '');
  const [linkuri, setLinkuri] = useState<Record<string, string>>(() => ({ ...(event.linkuri_stream ?? {}) }));
  const [status, setStatus] = useState(event.status);
  const [spectatori, setSpectatori] = useState(event.spectatori != null ? String(event.spectatori) : '');
  const [momenteLive, setMomenteLive] = useState(event.momente_live != null ? String(event.momente_live) : '');
  const [coverPath, setCoverPath] = useState(event.cover_path);
  const [coverIncarcare, setCoverIncarcare] = useState(false);
  const [tarife, setTarife] = useState(() =>
    TOATE_TIPURILE.map((tip, i) => {
      const existent = tarifeInitiale.find((t) => t.tip === tip);
      return {
        tip,
        pret: existent ? String(existent.pret_bani / 100) : '',
        activ: existent?.activ ?? tip !== 'stream',
        descriere: existent?.descriere ?? '',
        ordine: existent?.ordine ?? i,
      };
    })
  );
  const [durataStream, setDurataStream] = useState(String(event.durata_stream_secunde ?? 12));
  const [salvare, setSalvare] = useState('');
  const [qr, setQr] = useState('');
  const [galerie, setGalerie] = useState(galerieInitiala);
  const [galerieIncarcare, setGalerieIncarcare] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const galerieFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://12rounds.ro'}/live`;
    QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#0a0a0b', light: '#ffffff' } }).then(setQr);
  }, []);

  async function incarcaCoperta(fisier: File) {
    setCoverIncarcare(true);
    const extensie = fisier.name.split('.').pop() ?? 'jpg';
    const cale = `${event.id}/${crypto.randomUUID()}.${extensie}`;
    const { error } = await supabaseBrowser().storage.from('covere').upload(cale, fisier, { upsert: true });
    setCoverIncarcare(false);
    if (error) {
      alert('Încărcarea coperții a eșuat: ' + error.message);
      return;
    }
    setCoverPath(cale);
  }

  async function salveaza() {
    setSalvare('Se salvează…');
    const sb = supabaseBrowser();
    const linkuriCurate = Object.fromEntries(Object.entries(linkuri).filter(([, v]) => v.trim().length > 0));

    const { error: evErr } = await sb
      .from('events')
      .update({
        nume,
        subtitlu: subtitlu || null,
        slug,
        descriere: descriere || null,
        data_show: dataShow ? new Date(dataShow).toISOString() : null,
        locatie: locatie || null,
        artist_a: artistA || null,
        artist_b: artistB || null,
        linkuri_stream: linkuriCurate,
        cover_path: coverPath,
        spectatori: spectatori.trim() ? Math.max(0, parseInt(spectatori, 10)) : null,
        momente_live: momenteLive.trim() ? Math.max(0, parseInt(momenteLive, 10)) : null,
        durata_stream_secunde: Math.max(3, parseInt(durataStream, 10) || 12),
      })
      .eq('id', event.id);

    if (evErr) {
      setSalvare(
        evErr.code === '23505' ? 'Acest slug este deja folosit de alt eveniment.' : 'Eroare: ' + evErr.message
      );
      return;
    }

    for (const t of tarife) {
      await sb.from('tarife').upsert(
        {
          event_id: event.id,
          tip: t.tip,
          pret_bani: laBani(t.pret),
          activ: t.activ,
          descriere: t.descriere.trim() || null,
          ordine: t.ordine,
        },
        { onConflict: 'event_id,tip' }
      );
    }

    setSalvare('Salvat ✓');
    router.refresh();
    setTimeout(() => setSalvare(''), 2000);
  }

  async function incarcaGalerie(fisiere: FileList) {
    setGalerieIncarcare(true);
    const sb = supabaseBrowser();
    const adaugate: PozaGalerie[] = [];
    for (const fisier of Array.from(fisiere)) {
      const extensie = fisier.name.split('.').pop() ?? 'jpg';
      const cale = `${event.id}/${crypto.randomUUID()}.${extensie}`;
      const { error } = await sb.storage.from('galerie').upload(cale, fisier);
      if (error) {
        alert(`Încărcarea „${fisier.name}" a eșuat: ${error.message}`);
        continue;
      }
      const { data } = await sb
        .from('galerie')
        .insert({ event_id: event.id, path: cale, ordine: galerie.length + adaugate.length })
        .select()
        .single();
      if (data) adaugate.push(data as PozaGalerie);
    }
    setGalerie((prev) => [...prev, ...adaugate]);
    setGalerieIncarcare(false);
  }

  async function stergeDinGalerie(poza: PozaGalerie) {
    if (!window.confirm('Ștergi această poză din galerie?')) return;
    const sb = supabaseBrowser();
    await sb.storage.from('galerie').remove([poza.path]);
    await sb.from('galerie').delete().eq('id', poza.id);
    setGalerie((prev) => prev.filter((p) => p.id !== poza.id));
  }

  async function schimbaStatus(nou: Event['status']) {
    // Sarcina V4-G2: fara niciun tip de dedicatie activ, nu are ce sa vanda
    // editia — blocam tranzitia la LIVE cu un mesaj explicit.
    if (nou === 'live' && !tarife.some((t) => t.activ)) {
      alert('Activează cel puțin un tip de dedicație în secțiunea „Tarife" înainte să pornești LIVE.');
      return;
    }
    const confirmari: Partial<Record<Event['status'], string>> = {
      live: 'Pornești LIVE? Din acest moment se acceptă plăți pentru această ediție.',
      ended: 'Încheii show-ul? Nu se vor mai accepta plăți pentru această ediție.',
    };
    const mesaj = confirmari[nou];
    if (mesaj && !window.confirm(mesaj)) return;
    await supabaseBrowser().from('events').update({ status: nou }).eq('id', event.id);
    setStatus(nou);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="rand">
        <h1 style={{ margin: 0 }}>{nume || 'Eveniment nou'}</h1>
        <span className={`badge-eveniment ${status}`}>{ETICHETA_STATUS[status]}</span>
      </div>

      <div className="card">
        <div className="rand">
          <span>
            Status curent: <strong>{ETICHETA_STATUS[status]}</strong>
          </span>
          <span className="rand" style={{ width: 'auto', gap: 8 }}>
            {status === 'upcoming' && (
              <button className="btn ok mic" onClick={() => schimbaStatus('live')}>● Pornește LIVE</button>
            )}
            {status === 'live' && (
              <button className="btn danger mic" onClick={() => schimbaStatus('ended')}>■ Încheie show-ul</button>
            )}
            {status === 'ended' && (
              <button className="btn secondary mic" onClick={() => schimbaStatus('upcoming')}>↺ Redeschide</button>
            )}
          </span>
        </div>
      </div>

      <div className="card">
        <label>Copertă</label>
        <div
          className="editor-cover-preview"
          style={{ backgroundImage: `url(${urlCoperta(coverPath)})` }}
          onClick={() => fileRef.current?.click()}
        >
          {coverIncarcare && <span className="editor-cover-overlay-text">Se încarcă…</span>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && incarcaCoperta(e.target.files[0])}
        />
        <button type="button" className="btn secondary mic" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>
          Schimbă coperta
        </button>
        <p className="sub" style={{ marginTop: 6, textAlign: 'left' }}>Recomandat 1200×630px, pentru share-uri.</p>
      </div>

      <div className="card">
        <label htmlFor="nume">Titlu</label>
        <input id="nume" value={nume} onChange={(e) => setNume(e.target.value)} />
        <label htmlFor="subtitlu">Subtitlu</label>
        <input id="subtitlu" value={subtitlu} onChange={(e) => setSubtitlu(e.target.value)} />
        <label htmlFor="slug">Slug — URL: /eveniment/{slug || '…'}</label>
        <div className="rand" style={{ gap: 8 }}>
          <input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} style={{ flex: 1 }} />
          <button type="button" className="btn secondary mic" onClick={() => setSlug(slugify(nume))}>
            Din titlu
          </button>
        </div>
        <label htmlFor="descriere">Descriere</label>
        <textarea id="descriere" value={descriere} onChange={(e) => setDescriere(e.target.value)} />
        <label htmlFor="data">Data și ora show-ului</label>
        <input id="data" type="datetime-local" value={dataShow} onChange={(e) => setDataShow(e.target.value)} />
        <label htmlFor="locatie">Locație</label>
        <input id="locatie" value={locatie} onChange={(e) => setLocatie(e.target.value)} placeholder="Club X, București" />
        <label htmlFor="artistA">Artist A</label>
        <input id="artistA" value={artistA} onChange={(e) => setArtistA(e.target.value)} />
        <label htmlFor="artistB">Artist B</label>
        <input id="artistB" value={artistB} onChange={(e) => setArtistB(e.target.value)} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Tarife</h2>
        <p className="sub" style={{ margin: '0 0 10px', textAlign: 'left' }}>
          Doar tipurile active apar pe pagina publică, în ordinea de mai jos. Un eveniment fără
          niciun tip activ nu poate porni LIVE.
        </p>
        {tarife.map((t, i) => (
          <div key={t.tip} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div className="rand" style={{ marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, width: 'auto', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={t.activ}
                  onChange={(e) =>
                    setTarife((prev) => prev.map((x, j) => (j === i ? { ...x, activ: e.target.checked } : x)))
                  }
                  style={{ width: 'auto' }}
                />
                <strong>{NUME_TIP[t.tip]}</strong>
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={t.pret}
                onChange={(e) =>
                  setTarife((prev) => prev.map((x, j) => (j === i ? { ...x, pret: e.target.value } : x)))
                }
                style={{ width: 90 }}
                placeholder="lei"
              />
            </div>
            <div className="rand" style={{ gap: 8 }}>
              <input
                value={t.descriere}
                onChange={(e) =>
                  setTarife((prev) => prev.map((x, j) => (j === i ? { ...x, descriere: e.target.value } : x)))
                }
                placeholder={DESCRIERE_IMPLICITA[t.tip]}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                value={t.ordine}
                onChange={(e) =>
                  setTarife((prev) => prev.map((x, j) => (j === i ? { ...x, ordine: parseInt(e.target.value, 10) || 0 } : x)))
                }
                style={{ width: 64 }}
                title="Ordinea de afișare"
              />
            </div>
          </div>
        ))}

        <label htmlFor="durataStream" style={{ marginTop: 16, display: 'block' }}>
          Interval rotație overlay stream (secunde)
        </label>
        <input
          id="durataStream"
          type="number"
          min={3}
          value={durataStream}
          onChange={(e) => setDurataStream(e.target.value)}
          style={{ width: 90 }}
        />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cifrele ediției</h2>
        <p className="sub" style={{ margin: '0 0 4px', textAlign: 'left' }}>
          Completează după eveniment — apar pe pagina publică (Arhivă). Lasă gol dacă nu ai cifra, nu se afișează.
        </p>
        <label htmlFor="spectatori">Spectatori</label>
        <input id="spectatori" type="number" min={0} value={spectatori} onChange={(e) => setSpectatori(e.target.value)} placeholder="ex. 2400" />
        <label htmlFor="momenteLive">Momente live</label>
        <input id="momenteLive" type="number" min={0} value={momenteLive} onChange={(e) => setMomenteLive(e.target.value)} placeholder="ex. 13" />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Galerie foto</h2>
        <p className="sub" style={{ margin: '0 0 4px', textAlign: 'left' }}>
          Apare pe pagina publică a ediției, după ce e marcată „încheiat".
        </p>
        {galerie.length > 0 && (
          <div className="gal" style={{ marginBottom: 12 }}>
            {galerie.map((p) => (
              <div key={p.id} style={{ position: 'relative' }}>
                <div className="gal-item" style={{ backgroundImage: `url(${urlGalerie(p.path)})`, cursor: 'default' }} />
                <button
                  type="button"
                  className="btn danger mic"
                  style={{ position: 'absolute', top: 6, right: 6, padding: '4px 10px' }}
                  onClick={() => stergeDinGalerie(p)}
                >
                  Șterge
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={galerieFileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && e.target.files.length > 0 && incarcaGalerie(e.target.files)}
        />
        <button type="button" className="btn secondary mic" disabled={galerieIncarcare} onClick={() => galerieFileRef.current?.click()}>
          {galerieIncarcare ? 'Se încarcă…' : '+ Adaugă poze'}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Linkuri stream</h2>
        {PLATFORME_STREAM.map((p) => (
          <div key={p.cheie}>
            <label htmlFor={p.cheie}>{p.eticheta}</label>
            <input
              id={p.cheie}
              value={linkuri[p.cheie] ?? ''}
              onChange={(e) => setLinkuri((prev) => ({ ...prev, [p.cheie]: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        ))}
      </div>

      <button className="btn" onClick={salveaza}>Salvează</button>
      {salvare && <p className="sub" style={{ marginTop: 8 }}>{salvare}</p>}

      <div className="card" style={{ marginTop: 24, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Cod QR — 12rounds.ro/live</h2>
        {qr && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Cod QR către /live" width={200} height={200} style={{ margin: '0 auto', borderRadius: 12 }} />
            <a className="btn secondary" style={{ marginTop: 12 }} href={qr} download="12rounds-qr-live.png">
              Descarcă PNG
            </a>
          </>
        )}
      </div>
    </div>
  );
}
