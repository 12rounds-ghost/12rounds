'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ButonEvenimentNou() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function creeaza() {
    setLoading(true);
    const res = await fetch('/api/admin/evenimente', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? 'A apărut o eroare.');
      setLoading(false);
      return;
    }
    router.push(`/admin/evenimente/${data.id}`);
  }

  return (
    <button className="btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={creeaza} disabled={loading}>
      {loading ? 'Se creează…' : '+ Eveniment nou'}
    </button>
  );
}
