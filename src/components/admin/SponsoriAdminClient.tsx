'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { urlSponsorLogo } from '@/lib/storage';
import type { Sponsor } from '@/lib/types';

interface FormNou {
  nume: string;
  nivel: 'principal' | 'sustinator';
  eventId: string; // '' = global
  url: string;
  ordine: string;
}

const FORM_GOL: FormNou = { nume: '', nivel: 'sustinator', eventId: '', url: '', ordine: '0' };

export function SponsoriAdminClient({
  sponsoriInitiali,
  evenimente,
}: {
  sponsoriInitiali: Sponsor[];
  evenimente: { id: string; nume: string }[];
}) {
  const [sponsori, setSponsori] = useState(sponsoriInitiali);
  const [form, setForm] = useState<FormNou>(FORM_GOL);
  const [fisier, setFisier] = useState<File | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState('');

  const numeEveniment = (id: string | null) => evenimente.find((e) => e.id === id)?.nume ?? null;

  async function incarca() {
    const sb = supabaseBrowser();
    const { data } = await sb.from('sponsori').select('*').order('ordine', { ascending: true });
    setSponsori((data ?? []) as Sponsor[]);
  }

  async function adauga(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nume.trim()) {
      setEroare('Numele e obligatoriu.');
      return;
    }
    setSeSalveaza(true);
    setEroare('');
    const sb = supabaseBrowser();

    let logoPath: string | null = null;
    if (fisier) {
      const extensie = fisier.name.split('.').pop() ?? 'png';
      const cale = `${crypto.randomUUID()}.${extensie}`;
      const { error: uploadErr } = await sb.storage.from('sponsori').upload(cale, fisier, { upsert: true });
      if (uploadErr) {
        setEroare('Încărcarea logo-ului a eșuat: ' + uploadErr.message);
        setSeSalveaza(false);
        return;
      }
      logoPath = cale;
    }

    const { error: insErr } = await sb.from('sponsori').insert({
      nume: form.nume.trim(),
      nivel: form.nivel,
      event_id: form.eventId || null,
      url: form.url.trim() || null,
      ordine: parseInt(form.ordine, 10) || 0,
      logo_path: logoPath,
    });

    if (insErr) {
      setEroare('Eroare: ' + insErr.message);
      setSeSalveaza(false);
      return;
    }

    setForm(FORM_GOL);
    setFisier(null);
    setSeSalveaza(false);
    incarca();
  }

  async function comutaActiv(s: Sponsor) {
    await supabaseBrowser().from('sponsori').update({ activ: !s.activ }).eq('id', s.id);
    incarca();
  }

  async function sterge(s: Sponsor) {
    if (!window.confirm(`Ștergi sponsorul „${s.nume}"?`)) return;
    await supabaseBrowser().from('sponsori').delete().eq('id', s.id);
    incarca();
  }

  return (
    <div>
      <h1>Sponsori</h1>
      <p className="sub">Afișați pe prima pagină, secțiunea „Parteneri". Fără sponsori activi, secțiunea nu apare deloc.</p>

      <form onSubmit={adauga} className="card">
        <h2 style={{ marginTop: 0 }}>Adaugă sponsor</h2>
        <label htmlFor="s-nume">Nume</label>
        <input id="s-nume" value={form.nume} onChange={(e) => setForm((p) => ({ ...p, nume: e.target.value }))} placeholder="Ghost Records" />

        <label htmlFor="s-nivel">Nivel</label>
        <select id="s-nivel" value={form.nivel} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value as FormNou['nivel'] }))}>
          <option value="principal">Partener principal</option>
          <option value="sustinator">Susținător</option>
        </select>

        <label htmlFor="s-eveniment">Ediție (opțional — necompletat = sponsor global, pe toate edițiile)</label>
        <select id="s-eveniment" value={form.eventId} onChange={(e) => setForm((p) => ({ ...p, eventId: e.target.value }))}>
          <option value="">— Global —</option>
          {evenimente.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nume}</option>
          ))}
        </select>

        <label htmlFor="s-url">Link (opțional)</label>
        <input id="s-url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." />

        <label htmlFor="s-ordine">Ordine (mai mic = mai în față)</label>
        <input id="s-ordine" type="number" value={form.ordine} onChange={(e) => setForm((p) => ({ ...p, ordine: e.target.value }))} style={{ width: 100 }} />

        <label htmlFor="s-logo">Logo (opțional — fără el, apare doar numele)</label>
        <input id="s-logo" type="file" accept="image/*" onChange={(e) => setFisier(e.target.files?.[0] ?? null)} />

        <button className="btn" disabled={seSalveaza}>{seSalveaza ? 'Se salvează…' : 'Adaugă sponsor'}</button>
        {eroare && <p className="eroare">{eroare}</p>}
      </form>

      {sponsori.length === 0 ? (
        <div className="card">Niciun sponsor adăugat încă.</div>
      ) : (
        sponsori.map((s) => (
          <div key={s.id} className="card rand">
            <div className="rand" style={{ width: 'auto', gap: 12, justifyContent: 'flex-start' }}>
              {s.logo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlSponsorLogo(s.logo_path)} alt="" style={{ width: 48, height: 48, objectFit: 'contain', background: 'var(--panel-2)', borderRadius: 8 }} />
              ) : (
                <div style={{ width: 48, height: 48, background: 'var(--panel-2)', borderRadius: 8 }} />
              )}
              <div>
                <strong>{s.nume}</strong>
                <div className="sub" style={{ margin: 0, textAlign: 'left' }}>
                  {s.nivel === 'principal' ? 'Principal' : 'Susținător'} · {numeEveniment(s.event_id) ?? 'Global'}
                  {!s.activ && ' · inactiv'}
                </div>
              </div>
            </div>
            <div className="rand" style={{ width: 'auto', gap: 8 }}>
              <button className="btn secondary mic" onClick={() => comutaActiv(s)}>
                {s.activ ? 'Dezactivează' : 'Activează'}
              </button>
              <button className="btn danger mic" onClick={() => sterge(s)}>Șterge</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
