'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ComingSoon() {
  const router = useRouter();
  const [parola, setParola] = useState('');
  const [eroare, setEroare] = useState('');
  const [loading, setLoading] = useState(false);

  async function intra(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEroare('');
    const res = await fetch('/api/site-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: parola }),
    });
    if (!res.ok) {
      setEroare('Parolă greșită.');
      setLoading(false);
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
      <Image src="/logo.jpeg" alt="12 ROUNDS" width={110} height={110} className="logo" priority />
      <div className="brand">The battle of the bands</div>
      <h1>Revenim în curând</h1>
      <p className="sub">Site-ul este în pregătire. Dacă ai acces, introdu parola mai jos.</p>

      <form onSubmit={intra} className="card" style={{ maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
        <label htmlFor="parola">Parolă</label>
        <input
          id="parola"
          type="password"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          autoFocus
          required
        />
        <button className="btn" disabled={loading}>{loading ? 'Se verifică…' : 'Intră'}</button>
        {eroare && <p className="eroare">{eroare}</p>}
      </form>
    </main>
  );
}
