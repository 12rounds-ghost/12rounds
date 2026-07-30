'use client';
import { useState } from 'react';
import { NUME_TIP, lei, type Tarif, type TipDedicatie } from '@/lib/types';
import { PlataElements } from '@/components/PlataElements';
import { salveazaDedicatieLocala } from '@/lib/dedicatii-locale';

export function DedicationForm({
  tarife,
  src,
  eventId,
  eventSlug,
}: {
  tarife: Tarif[];
  src: string;
  eventId: string;
  eventSlug: string;
}) {
  const [tip, setTip] = useState<TipDedicatie | null>(null);
  const [deLa, setDeLa] = useState('');
  const [pentru, setPentru] = useState('');
  const [artist, setArtist] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [modClasic, setModClasic] = useState(false);
  const [loadingClasic, setLoadingClasic] = useState(false);
  const [eroareClasic, setEroareClasic] = useState('');

  const [pozaPath, setPozaPath] = useState<string | null>(null);
  const [pozaPreview, setPozaPreview] = useState<string | null>(null);
  const [pozaIncarcare, setPozaIncarcare] = useState(false);
  const [pozaEroare, setPozaEroare] = useState('');

  const esteDedicatie = tip === 'ecran' || tip === 'prezentator';
  const tarifSelectat = tarife.find((t) => t.tip === tip) ?? null;
  const mesajValid = !esteDedicatie || mesaj.trim().length >= 2;

  async function incarcaPoza(fisier: File) {
    setPozaEroare('');
    setPozaIncarcare(true);
    setPozaPreview(URL.createObjectURL(fisier));
    try {
      const fd = new FormData();
      fd.append('fisier', fisier);
      const res = await fetch('/api/upload-poza', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Încărcarea a eșuat.');
      setPozaPath(data.poza_path);
    } catch (e) {
      setPozaEroare(e instanceof Error ? e.message : 'Încărcarea a eșuat.');
      setPozaPreview(null);
      setPozaPath(null);
    } finally {
      setPozaIncarcare(false);
    }
  }

  function eliminaPoza() {
    setPozaPath(null);
    setPozaPreview(null);
    setPozaEroare('');
  }

  // Fluxul de rezervă (Sarcina E, Pasul 7): Stripe Checkout găzduit, folosit
  // cand Express Checkout Element nu se încarcă sau clientul îl alege explicit.
  // Aici emailul e obligatoriu — acceptabil pentru un caz marginal.
  async function plateasteClasic() {
    if (!tip || loadingClasic || pozaIncarcare) return;
    setLoadingClasic(true);
    setEroareClasic('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip,
          de_la: deLa,
          pentru,
          artist_preferat: artist,
          mesaj,
          src,
          event_id: eventId,
          poza_path: pozaPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la plată.');
      if (data.dedicatie_id) {
        salveazaDedicatieLocala({ id: data.dedicatie_id, event_slug: eventSlug });
      }
      window.location.href = data.url;
    } catch (e) {
      const eCazutConexiune = e instanceof TypeError;
      setEroareClasic(
        eCazutConexiune
          ? 'Conexiunea a picat. Verifică semnalul și încearcă din nou.'
          : e instanceof Error
            ? e.message
            : 'A apărut o eroare.'
      );
      setLoadingClasic(false);
    }
  }

  return (
    <div>
      {tarife.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tier${tip === t.tip ? ' selected' : ''}`}
          onClick={() => setTip(t.tip)}
        >
          <span>{NUME_TIP[t.tip]}</span>
          <span className="pret">{lei(t.pret_bani)}</span>
        </button>
      ))}

      {esteDedicatie && (
        <div className="card">
          <label htmlFor="dela">De la</label>
          <input id="dela" value={deLa} onChange={(e) => setDeLa(e.target.value)} placeholder="George" maxLength={80} />
          <label htmlFor="pentru">Pentru</label>
          <input id="pentru" value={pentru} onChange={(e) => setPentru(e.target.value)} placeholder="Maria" maxLength={80} />
          <label htmlFor="artist">Artist preferat (opțional)</label>
          <input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Luis Gabriel" maxLength={80} />
          <label htmlFor="mesaj">Mesajul tău</label>
          <textarea
            id="mesaj"
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            placeholder="La mulți ani, Maria! Să avem o seară extraordinară împreună!"
            maxLength={300}
          />
          <div className="contor-caractere">{mesaj.length} / 300</div>

          <label>Adaugă o poză (opțional)</label>
          {pozaPreview ? (
            <div className="poza-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pozaPreview} alt="Previzualizare poză" className="poza-preview" />
              {pozaIncarcare ? (
                <div className="sub" style={{ margin: 0 }}>Se încarcă…</div>
              ) : (
                <button type="button" className="btn secondary mic" onClick={eliminaPoza}>
                  Elimină poza
                </button>
              )}
            </div>
          ) : (
            <label className="poza-buton-upload">
              📷 Adaugă o poză
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && incarcaPoza(e.target.files[0])}
              />
            </label>
          )}
          {pozaEroare && <p className="eroare">{pozaEroare}</p>}
          <p className="sub" style={{ textAlign: 'left', margin: '6px 0 0' }}>
            Poza apare pe ecran alături de mesaj, după verificarea moderatorului. Nu urca poze cu
            alte persoane fără acordul lor.
          </p>
        </div>
      )}

      {tip && tarifSelectat && mesajValid && !pozaIncarcare && (
        <div className="card" style={{ marginTop: 16 }}>
          {modClasic ? (
            <>
              <button className="btn" onClick={plateasteClasic} disabled={loadingClasic}>
                {loadingClasic ? 'Se deschide plata…' : `Plătește ${lei(tarifSelectat.pret_bani)}`}
              </button>
              {eroareClasic && <p className="eroare">{eroareClasic}</p>}
            </>
          ) : (
            <PlataElements
              sumaBani={tarifSelectat.pret_bani}
              eventSlug={eventSlug}
              dateDedicatie={{
                tip,
                de_la: deLa,
                pentru,
                artist_preferat: artist,
                mesaj,
                src,
                event_id: eventId,
                poza_path: pozaPath,
              }}
              onEsuatEncarcare={() => setModClasic(true)}
            />
          )}
          <button
            type="button"
            className="link-discret"
            onClick={() => setModClasic((v) => !v)}
          >
            {modClasic ? '← Înapoi la plata rapidă' : 'Ai probleme cu plata? Încearcă varianta clasică'}
          </button>
        </div>
      )}
    </div>
  );
}
