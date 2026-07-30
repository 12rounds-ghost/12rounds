'use client';
import { useState } from 'react';

export function ButonCuratenie() {
  const [mesaj, setMesaj] = useState('');
  const [loading, setLoading] = useState(false);

  async function curata() {
    setLoading(true);
    setMesaj('');
    const res = await fetch('/api/admin/curatenie-poze', { method: 'POST' });
    const data = await res.json();
    setMesaj(res.ok ? `${data.sterse} poze vechi șterse.` : (data.error ?? 'Eroare.'));
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button className="btn secondary mic" onClick={curata} disabled={loading}>
        {loading ? 'Se curăță…' : '🧹 Curăță poze vechi (48h+)'}
      </button>
      {mesaj && <p className="sub" style={{ marginTop: 6, textAlign: 'left' }}>{mesaj}</p>}
    </div>
  );
}
