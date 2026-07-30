'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { NUME_TIP, lei, type Dedicatie } from '@/lib/types';
import type { RolModerator } from '@/lib/auth-admin';
import { urlPozaAprobata } from '@/lib/storage';

const PE_PAGINA = 25;

const OPTIUNI_STATUS_PLATA = ['pending', 'paid', 'refunded', 'expired'] as const;
const OPTIUNI_STATUS_MODERARE = ['in_verificare', 'aprobat', 'respins'] as const;
const OPTIUNI_STATUS_DIFUZARE = ['in_asteptare', 'programat', 'difuzat'] as const;

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
  const [incarcare, setIncarcare] = useState(true);
  const [expandat, setExpandat] = useState<string | null>(null);
  const [numeFacturaEdit, setNumeFacturaEdit] = useState<Record<string, string>>({});
  const [reincercare, setReincercare] = useState<string | null>(null);
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
    if (aprobat) {
      await sb.from('dedicatii').update({ status_moderare: 'aprobat', moderator_id: sesiune.user?.id }).eq('id', d.id);
    } else {
      const motiv = window.prompt('Motivul respingerii (îl vede clientul):') ?? '';
      await sb
        .from('dedicatii')
        .update({ status_moderare: 'respins', motiv_respingere: motiv, moderator_id: sesiune.user?.id })
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
          <select value={filtre.statusDifuzare} onChange={(e) => actualizeazaFiltru('statusDifuzare', e.target.value)}>
            <option value="">Difuzare — toate</option>
            {OPTIUNI_STATUS_DIFUZARE.map((s) => <option key={s} value={s}>{s}</option>)}
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
                  )}
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
