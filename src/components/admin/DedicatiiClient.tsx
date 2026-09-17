'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { NUME_TIP, CADOURI, NUME_CADOU, lei, type Dedicatie, type TipDedicatie, type CadouDedicatie } from '@/lib/types';
import type { RolModerator } from '@/lib/auth-admin';
import { urlPozaAprobata } from '@/lib/storage';

const TIPURI: TipDedicatie[] = ['sustinere', 'ecran', 'stream', 'prezentator'];

// Sarcina: backup pentru cazul unei probleme/blocaj la platile online — admin-ul
// poate adauga o dedicatie direct, fara Stripe. Intra direct 'paid' (vezi
// /api/admin/dedicatii/manual), ca sa fie imediat eligibila pentru difuzare.
function AdaugaManualCard({
  evenimente,
  onAdaugat,
}: {
  evenimente: { id: string; nume: string }[];
  onAdaugat: () => void;
}) {
  const [deschis, setDeschis] = useState(false);
  const [eventId, setEventId] = useState('');
  const [tip, setTip] = useState<TipDedicatie>('ecran');
  const [deLa, setDeLa] = useState('');
  const [pentru, setPentru] = useState('');
  const [artistPreferat, setArtistPreferat] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [cadou, setCadou] = useState<CadouDedicatie>('crown');
  const [sumaLei, setSumaLei] = useState('0');
  const [aprobaAutomat, setAprobaAutomat] = useState(true);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState('');

  const areNevoieDeCadou = tip === 'ecran' || tip === 'stream';

  function reseteaza() {
    setEventId('');
    setTip('ecran');
    setDeLa('');
    setPentru('');
    setArtistPreferat('');
    setMesaj('');
    setCadou('crown');
    setSumaLei('0');
    setAprobaAutomat(true);
    setEroare('');
  }

  async function trimite() {
    setEroare('');
    if (!eventId) {
      setEroare('Alege ediția.');
      return;
    }
    setSeSalveaza(true);
    try {
      const res = await fetch('/api/admin/dedicatii/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          tip,
          de_la: deLa,
          pentru,
          artist_preferat: artistPreferat,
          mesaj,
          cadou: areNevoieDeCadou ? cadou : null,
          suma_lei: Number(sumaLei) || 0,
          aproba_automat: aprobaAutomat,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'A apărut o eroare.' }));
        setEroare(error);
        return;
      }
      reseteaza();
      setDeschis(false);
      onAdaugat();
    } finally {
      setSeSalveaza(false);
    }
  }

  return (
    <div className="card">
      <div className="rand" style={{ cursor: 'pointer' }} onClick={() => setDeschis((d) => !d)}>
        <strong>+ Adaugă dedicație manuală (fără plată)</strong>
        <span className="sub" style={{ margin: 0 }}>{deschis ? '▲' : '▼'}</span>
      </div>
      {deschis && (
        <div style={{ marginTop: 12 }}>
          <p className="sub" style={{ textAlign: 'left', margin: '0 0 12px' }}>
            Rezervă pentru cazul unei probleme cu plățile online — intră direct ca „paid", fără Stripe.
            Marcată cu sursă „admin-manual", ca s-o poți găsi separat.
          </p>
          <div className="grid-filtre-dedicatii">
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">Alege ediția…</option>
              {evenimente.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nume}</option>
              ))}
            </select>
            <select value={tip} onChange={(e) => setTip(e.target.value as TipDedicatie)}>
              {TIPURI.map((t) => (
                <option key={t} value={t}>{NUME_TIP[t]}</option>
              ))}
            </select>
            <input placeholder="De la" value={deLa} onChange={(e) => setDeLa(e.target.value)} />
            <input placeholder="Pentru" value={pentru} onChange={(e) => setPentru(e.target.value)} />
            <input placeholder="Artist preferat (opțional)" value={artistPreferat} onChange={(e) => setArtistPreferat(e.target.value)} />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Sumă (lei) — 0 dacă e gratuit"
              value={sumaLei}
              onChange={(e) => setSumaLei(e.target.value)}
            />
          </div>
          {tip !== 'sustinere' && (
            <textarea
              placeholder="Mesajul dedicației"
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              style={{ marginTop: 10 }}
            />
          )}
          {areNevoieDeCadou && (
            <div style={{ marginTop: 10 }}>
              <p className="sub" style={{ textAlign: 'left', margin: '0 0 8px' }}>Cadou (implicit „coroană" dacă nu alegi altul)</p>
              <div className="cadouri-grid">
                {CADOURI.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`cadou-item${cadou === c ? ' selected' : ''}`}
                    onClick={() => setCadou(c)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/rounds-kit/assets/gifts/${c}/poster.png`} alt="" />
                    <span>{NUME_CADOU[c]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="rand" style={{ gap: 6, justifyContent: 'flex-start', width: 'auto', marginTop: 12 }}>
            <input type="checkbox" checked={aprobaAutomat} onChange={(e) => setAprobaAutomat(e.target.checked)} />
            Aprobă automat (nu mai trece prin „Moderare")
          </label>
          {eroare && <p className="eroare">{eroare}</p>}
          <button className="btn mic" style={{ marginTop: 12 }} disabled={seSalveaza} onClick={trimite}>
            {seSalveaza ? 'Se adaugă…' : 'Adaugă dedicația'}
          </button>
        </div>
      )}
    </div>
  );
}

const PE_PAGINA = 25;

const OPTIUNI_STATUS_PLATA = ['pending', 'paid', 'refunded', 'expired'] as const;
const OPTIUNI_STATUS_MODERARE = ['in_verificare', 'aprobat', 'respins'] as const;
const OPTIUNI_STATUS_DIFUZARE = ['in_asteptare', 'programat', 'difuzat'] as const;

// Sarcina: tab-uri pe status_difuzare, in loc de un dropdown ingropat in
// mijlocul filtrelor — mult mai clar la o privire cate sunt de difuzat vs.
// deja difuzate, mai ales cand lista devine lunga.
const TABURI_DIFUZARE: { cheie: '' | (typeof OPTIUNI_STATUS_DIFUZARE)[number]; eticheta: string }[] = [
  { cheie: '', eticheta: 'Toate' },
  { cheie: 'in_asteptare', eticheta: 'În așteptare' },
  { cheie: 'programat', eticheta: 'Programat' },
  { cheie: 'difuzat', eticheta: 'Difuzat' },
];

interface Filtre {
  eventId: string;
  statusPlata: string;
  statusModerare: string;
  statusDifuzare: string;
  sursa: string;
  cautare: string;
  dataDeLa: string;
  dataPanaLa: string;
  doarFacturiProbleme: boolean;
  doarEmailuriNereusite: boolean;
}

const FILTRE_GOALE: Filtre = {
  eventId: '',
  statusPlata: '',
  statusModerare: '',
  statusDifuzare: '',
  sursa: '',
  cautare: '',
  dataDeLa: '',
  dataPanaLa: '',
  doarFacturiProbleme: false,
  doarEmailuriNereusite: false,
};

function aplicaFiltre<T>(q: T, f: Filtre): T {
  // supabase-js intoarce acelasi tip de builder la fiecare .eq/.gte/.lte/.or,
  // deci inlantuirea conditionala e sigura desi TS o vede generic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = q as any;
  if (f.eventId) query = query.eq('event_id', f.eventId);
  if (f.statusPlata) query = query.eq('status_plata', f.statusPlata);
  if (f.statusModerare) query = query.eq('status_moderare', f.statusModerare);
  if (f.statusDifuzare) query = query.eq('status_difuzare', f.statusDifuzare);
  if (f.sursa) query = query.eq('sursa_platforma', f.sursa);
  if (f.dataDeLa) query = query.gte('created_at', f.dataDeLa);
  if (f.dataPanaLa) query = query.lte('created_at', `${f.dataPanaLa}T23:59:59`);
  if (f.doarFacturiProbleme) query = query.in('factura_status', ['eroare', 'manual']);
  if (f.doarEmailuriNereusite) query = query.not('email_eroare', 'is', null);
  if (f.cautare.trim()) {
    const termen = `%${f.cautare.trim()}%`;
    query = query.or(`mesaj.ilike.${termen},de_la.ilike.${termen},pentru.ilike.${termen}`);
  }
  return query;
}

function celulaCsv(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function descarcaCsv(continut: string, numeFisier: string) {
  const blob = new Blob(['﻿' + continut], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = numeFisier;
  a.click();
  URL.revokeObjectURL(url);
}

export function DedicatiiClient({
  evenimente,
  rol,
}: {
  evenimente: { id: string; nume: string }[];
  rol: RolModerator;
}) {
  const [filtre, setFiltre] = useState<Filtre>(FILTRE_GOALE);
  const [pagina, setPagina] = useState(0);
  const [lista, setLista] = useState<Dedicatie[]>([]);
  const [total, setTotal] = useState(0);
  const [numarPeTab, setNumarPeTab] = useState<Record<string, number>>({});
  const [incarcare, setIncarcare] = useState(true);
  const [expandat, setExpandat] = useState<string | null>(null);
  const [numeFacturaEdit, setNumeFacturaEdit] = useState<Record<string, string>>({});
  const [reincercare, setReincercare] = useState<string | null>(null);
  const [reincercareEmail, setReincercareEmail] = useState<string | null>(null);
  const esteAdmin = rol === 'admin';

  const numeEveniment = useCallback(
    (id: string) => evenimente.find((e) => e.id === id)?.nume ?? '—',
    [evenimente]
  );

  const incarca = useCallback(async () => {
    setIncarcare(true);
    const sb = supabaseBrowser();
    const query = aplicaFiltre(sb.from('dedicatii').select('*', { count: 'exact' }), filtre)
      .order('created_at', { ascending: false })
      .range(pagina * PE_PAGINA, pagina * PE_PAGINA + PE_PAGINA - 1);
    const { data, count } = await query;
    setLista((data ?? []) as Dedicatie[]);
    setTotal(count ?? 0);
    setIncarcare(false);

    // Numarul de pe fiecare tab tine cont de restul filtrelor active
    // (editie, cautare etc.) dar ignora tab-ul insusi — altfel tab-urile
    // nealese ar arata mereu 0, fiindca filtrul lor pe statusDifuzare nu s-ar
    // mai potrivi cu el insusi.
    const filtreFaraTab = { ...filtre, statusDifuzare: '' };
    const sbNumaratoare = supabaseBrowser();
    const rezultate = await Promise.all(
      TABURI_DIFUZARE.map((t) =>
        aplicaFiltre(
          sbNumaratoare.from('dedicatii').select('id', { count: 'exact', head: true }),
          { ...filtreFaraTab, statusDifuzare: t.cheie }
        )
      )
    );
    setNumarPeTab(Object.fromEntries(TABURI_DIFUZARE.map((t, i) => [t.cheie, rezultate[i].count ?? 0])));
  }, [filtre, pagina]);

  useEffect(() => {
    incarca();
  }, [incarca]);

  function actualizeazaFiltru<K extends keyof Filtre>(cheie: K, valoare: Filtre[K]) {
    setPagina(0);
    setFiltre((prev) => ({ ...prev, [cheie]: valoare }));
  }

  async function aprobaRespinge(d: Dedicatie, aprobat: boolean) {
    const sb = supabaseBrowser();
    const { data: sesiune } = await sb.auth.getUser();
    const moderatLa = new Date().toISOString();
    if (aprobat) {
      await sb
        .from('dedicatii')
        .update({ status_moderare: 'aprobat', moderator_id: sesiune.user?.id, moderat_la: moderatLa })
        .eq('id', d.id);
    } else {
      const motiv = window.prompt('Motivul respingerii (îl vede clientul):') ?? '';
      await sb
        .from('dedicatii')
        .update({ status_moderare: 'respins', motiv_respingere: motiv, moderator_id: sesiune.user?.id, moderat_la: moderatLa })
        .eq('id', d.id);
    }
    incarca();
  }

  async function ramburseaza(d: Dedicatie) {
    if (!window.confirm('Sigur rambursezi această dedicație?')) return;
    const res = await fetch('/api/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dedicatie_id: d.id }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Rambursarea a eșuat.' }));
      alert(error);
    }
    incarca();
  }

  async function reincearcaFactura(d: Dedicatie) {
    const nume = (numeFacturaEdit[d.id] ?? d.nume_facturare ?? '').trim();
    if (nume.length < 3) {
      alert('Numele trebuie să aibă cel puțin 3 caractere.');
      return;
    }
    setReincercare(d.id);
    const res = await fetch(`/api/admin/dedicatii/${d.id}/factura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nume }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'A apărut o eroare.' }));
      alert(error);
    }
    setReincercare(null);
    incarca();
  }

  async function reincearcaEmail(d: Dedicatie) {
    setReincercareEmail(d.id);
    const res = await fetch(`/api/admin/dedicatii/${d.id}/retrimite-email`, { method: 'POST' });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'A apărut o eroare.' }));
      alert(error);
    }
    setReincercareEmail(null);
    incarca();
  }

  async function retrimitePeEcran(d: Dedicatie) {
    await supabaseBrowser()
      .from('dedicatii')
      .update({ status_difuzare: 'in_asteptare', difuzat_la: null })
      .eq('id', d.id);
    incarca();
  }

  async function exportaCsv() {
    const sb = supabaseBrowser();
    const query = aplicaFiltre(sb.from('dedicatii').select('*'), filtre)
      .order('created_at', { ascending: false })
      .limit(5000);
    const { data } = await query;
    const randuri = (data ?? []) as Dedicatie[];

    const antet = [
      'id', 'eveniment', 'tip', 'status_plata', 'status_moderare', 'status_difuzare',
      'de_la', 'pentru', 'artist_preferat', 'mesaj', 'sursa_platforma', 'email',
      ...(esteAdmin ? ['suma_bani'] : []),
      'created_at',
    ];
    const linii = randuri.map((d) =>
      [
        d.id, numeEveniment(d.event_id), d.tip, d.status_plata, d.status_moderare, d.status_difuzare,
        d.de_la, d.pentru, d.artist_preferat, d.mesaj, d.sursa_platforma, d.email,
        ...(esteAdmin ? [d.suma_bani] : []),
        d.created_at,
      ]
        .map(celulaCsv)
        .join(',')
    );
    descarcaCsv([antet.map(celulaCsv).join(','), ...linii].join('\n'), `dedicatii-${Date.now()}.csv`);
  }

  const totalPagini = Math.max(1, Math.ceil(total / PE_PAGINA));

  return (
    <div>
      <h1>Dedicații</h1>
      <p className="sub">Toate dedicațiile, din toate edițiile — {total} rezultate.</p>

      {esteAdmin && <AdaugaManualCard evenimente={evenimente} onAdaugat={incarca} />}

      <div className="tab-bar">
        {TABURI_DIFUZARE.map((t) => (
          <button
            key={t.cheie}
            type="button"
            className={filtre.statusDifuzare === t.cheie ? 'activ' : ''}
            onClick={() => actualizeazaFiltru('statusDifuzare', t.cheie)}
          >
            {t.eticheta} <span className="numar">{numarPeTab[t.cheie] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="grid-filtre-dedicatii">
          <select value={filtre.eventId} onChange={(e) => actualizeazaFiltru('eventId', e.target.value)}>
            <option value="">Toate edițiile</option>
            {evenimente.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nume}</option>
            ))}
          </select>
          <select value={filtre.statusPlata} onChange={(e) => actualizeazaFiltru('statusPlata', e.target.value)}>
            <option value="">Plată — toate</option>
            {OPTIUNI_STATUS_PLATA.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtre.statusModerare} onChange={(e) => actualizeazaFiltru('statusModerare', e.target.value)}>
            <option value="">Moderare — toate</option>
            {OPTIUNI_STATUS_MODERARE.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            placeholder="Sursă (qr, tiktok...)"
            value={filtre.sursa}
            onChange={(e) => actualizeazaFiltru('sursa', e.target.value)}
          />
          <input
            placeholder="Caută text, de la, pentru…"
            value={filtre.cautare}
            onChange={(e) => actualizeazaFiltru('cautare', e.target.value)}
          />
          <input type="date" value={filtre.dataDeLa} onChange={(e) => actualizeazaFiltru('dataDeLa', e.target.value)} />
          <input type="date" value={filtre.dataPanaLa} onChange={(e) => actualizeazaFiltru('dataPanaLa', e.target.value)} />
        </div>
        <div className="rand" style={{ marginTop: 12 }}>
          <button className="btn secondary mic" onClick={() => setFiltre(FILTRE_GOALE)}>Resetează filtrele</button>
          <button className="btn mic" onClick={exportaCsv}>⬇ Export CSV</button>
          {esteAdmin && (
            <label className="rand" style={{ gap: 6, justifyContent: 'flex-start', width: 'auto' }}>
              <input
                type="checkbox"
                checked={filtre.doarFacturiProbleme}
                onChange={(e) => actualizeazaFiltru('doarFacturiProbleme', e.target.checked)}
              />
              Facturi cu probleme
            </label>
          )}
          <label className="rand" style={{ gap: 6, justifyContent: 'flex-start', width: 'auto' }}>
            <input
              type="checkbox"
              checked={filtre.doarEmailuriNereusite}
              onChange={(e) => actualizeazaFiltru('doarEmailuriNereusite', e.target.checked)}
            />
            Emailuri nereușite
          </label>
        </div>
      </div>

      {incarcare ? (
        <div className="card">Se încarcă…</div>
      ) : lista.length === 0 ? (
        <div className="card">Nicio dedicație pentru aceste filtre.</div>
      ) : (
        lista.map((d) => {
          const deschis = expandat === d.id;
          return (
            <div key={d.id} className="card mesaj-card">
              <div className="rand" style={{ cursor: 'pointer' }} onClick={() => setExpandat(deschis ? null : d.id)}>
                <div>
                  <span className="badge gold">{NUME_TIP[d.tip]}</span>{' '}
                  <span className="badge">{d.status_plata}</span>{' '}
                  <span className="badge">{d.status_moderare}</span>{' '}
                  <span className="badge">{d.status_difuzare}</span>{' '}
                  {esteAdmin && (d.factura_status === 'eroare' || d.factura_status === 'manual') && (
                    <span className="badge danger">factură: {d.factura_status}</span>
                  )}{' '}
                  {d.email_eroare && <span className="badge danger">email nereușit</span>}
                  <div className="sub" style={{ margin: '4px 0 0', textAlign: 'left' }}>
                    {numeEveniment(d.event_id)} · {new Date(d.created_at).toLocaleString('ro-RO')}
                    {esteAdmin && <> · {lei(d.suma_bani)}</>}
                  </div>
                </div>
                <span className="sub" style={{ margin: 0 }}>{deschis ? '▲' : '▼'}</span>
              </div>

              {deschis && (
                <div style={{ marginTop: 12 }}>
                  <div className="text">„{d.mesaj || '(fără mesaj)'}"</div>
                  <div className="meta">
                    De la <strong>{d.de_la || '—'}</strong> pentru <strong>{d.pentru || '—'}</strong>
                    {d.artist_preferat && <> · artist: {d.artist_preferat}</>}
                    {d.email && <> · {d.email}</>}
                    {d.sursa_platforma && <> · sursă: {d.sursa_platforma}</>}
                  </div>
                  {d.motiv_respingere && (
                    <p className="sub" style={{ textAlign: 'left', color: 'var(--accent-hover)' }}>
                      Motiv respingere: {d.motiv_respingere}
                    </p>
                  )}
                  {esteAdmin && (d.factura_status === 'eroare' || d.factura_status === 'manual') && (
                    <div className="card" style={{ marginTop: 8, background: 'var(--panel-2)' }}>
                      <p className="sub" style={{ textAlign: 'left', margin: '0 0 8px', color: 'var(--accent-hover)' }}>
                        Problemă facturare: {d.factura_eroare ?? 'necunoscută'}
                      </p>
                      <label htmlFor={`nume-factura-${d.id}`}>Nume complet pentru factură</label>
                      <input
                        id={`nume-factura-${d.id}`}
                        value={numeFacturaEdit[d.id] ?? d.nume_facturare ?? ''}
                        onChange={(e) => setNumeFacturaEdit((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="Nume Prenume"
                      />
                      <button
                        type="button"
                        className="btn mic"
                        style={{ marginTop: 8 }}
                        disabled={reincercare === d.id}
                        onClick={() => reincearcaFactura(d)}
                      >
                        {reincercare === d.id ? 'Se salvează…' : 'Reîncearcă emiterea'}
                      </button>
                    </div>
                  )}
                  {d.email_eroare && (
                    <div className="card" style={{ marginTop: 8, background: 'var(--panel-2)' }}>
                      <p className="sub" style={{ textAlign: 'left', margin: '0 0 8px', color: 'var(--accent-hover)' }}>
                        Email nereușit ({d.email ?? 'fără adresă'}): {d.email_eroare}
                      </p>
                      <button
                        type="button"
                        className="btn mic"
                        disabled={reincercareEmail === d.id}
                        onClick={() => reincearcaEmail(d)}
                      >
                        {reincercareEmail === d.id ? 'Se retrimite…' : 'Retrimite email'}
                      </button>
                    </div>
                  )}
                  {d.poza_aprobata && d.poza_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlPozaAprobata(d.poza_path)}
                      alt="Poza dedicației"
                      style={{ maxWidth: 200, borderRadius: 10, marginTop: 8 }}
                    />
                  )}

                  <div className="rand" style={{ marginTop: 12, justifyContent: 'flex-start', gap: 8 }}>
                    {d.status_moderare === 'in_verificare' && (
                      <>
                        <button className="btn ok mic" onClick={() => aprobaRespinge(d, true)}>Aprobă</button>
                        <button className="btn danger mic" onClick={() => aprobaRespinge(d, false)}>Respinge</button>
                      </>
                    )}
                    {esteAdmin && d.status_plata === 'paid' && (
                      <button className="btn danger mic" onClick={() => ramburseaza(d)}>Rambursează</button>
                    )}
                    {d.status_difuzare === 'difuzat' && (
                      <button className="btn secondary mic" onClick={() => retrimitePeEcran(d)}>
                        ↺ Retrimite pe ecran
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {total > PE_PAGINA && (
        <div className="rand" style={{ marginTop: 12 }}>
          <button className="btn secondary mic" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
            ← Anterior
          </button>
          <span className="sub" style={{ margin: 0 }}>Pagina {pagina + 1} / {totalPagini}</span>
          <button
            className="btn secondary mic"
            disabled={pagina + 1 >= totalPagini}
            onClick={() => setPagina((p) => p + 1)}
          >
            Următor →
          </button>
        </div>
      )}
    </div>
  );
}
