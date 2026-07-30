'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [eroare, setEroare] = useState('');
  const [loading, setLoading] = useState(false);

  async function intra(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEroare('');
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: parola });
    if (error || !data.user) {
      setEroare('Email sau parolă greșite.');
      setLoading(false);
      return;
    }

    // fiecare rol are o "pagina de start" diferita (Sarcina D, IMPLEMENTARE-V2.md)
    const { data: mod } = await sb.from('moderatori').select('rol').eq('id', data.user.id).maybeSingle();
    const destinatie =
      mod?.rol === 'admin' ? '/admin' : mod?.rol === 'operator' ? '/admin/regie' : '/admin/moderare';
    router.replace(destinatie);
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h1>Autentificare echipă</h1>
      <form onSubmit={intra} className="card">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="parola">Parolă</label>
        <input id="parola" type="password" value={parola} onChange={(e) => setParola(e.target.value)} required />
        <button className="btn" disabled={loading}>{loading ? 'Se verifică…' : 'Intră'}</button>
        {eroare && <p className="eroare">{eroare}</p>}
      </form>
    </div>
  );
}
