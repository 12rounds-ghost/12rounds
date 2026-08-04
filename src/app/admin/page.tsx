import Link from 'next/link';
import { cereRol } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ButonEvenimentNou } from '@/components/admin/ButonEvenimentNou';
import { ButonCuratenie } from '@/components/admin/ButonCuratenie';
import { lei, type Event } from '@/lib/types';

const ETICHETA_STATUS: Record<Event['status'], string> = {
  live: 'LIVE',
  upcoming: 'urmează',
  ended: 'încheiat',
};

export default async function AdminDashboard() {
  await cereRol(['admin']);

  const sb = supabaseAdmin();
  const [{ data: evenimente }, { data: dedicatii }] = await Promise.all([
    sb.from('events').select('*').order('created_at', { ascending: false }),
    sb
      .from('dedicatii')
      .select('event_id, tip, suma_bani, status_plata, status_moderare, status_difuzare'),
  ]);

  const lista = (evenimente ?? []) as Event[];
  const randuri = dedicatii ?? [];

  const live = lista.find((e) => e.status === 'live') ?? null;

  function statisticiEveniment(eventId: string) {
    const aleEvenimentului = randuri.filter((r) => r.event_id === eventId);
    const platite = aleEvenimentului.filter((r) => r.status_plata === 'paid');
    return {
      numarDedicatii: platite.length,
      incasari: platite.reduce((s, r) => s + r.suma_bani, 0),
      inAsteptareModerare: platite.filter((r) => r.status_moderare === 'in_verificare').length,
      inCoadaPrezentator: platite.filter(
        (r) => r.tip === 'prezentator' && r.status_moderare === 'aprobat' && ['in_asteptare', 'programat'].includes(r.status_difuzare)
      ).length,
      difuzate: platite.filter((r) => r.status_difuzare === 'difuzat').length,
    };
  }

  return (
    <div>
      <div className="rand" style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <ButonEvenimentNou />
      </div>
      <ButonCuratenie />

      {live && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div className="rand" style={{ marginBottom: 12 }}>
            <span className="badge-eveniment live pulsand">● LIVE ACUM</span>
            <strong>{live.nume}</strong>
          </div>
          {(() => {
            const s = statisticiEveniment(live.id);
            return (
              <div className="grid-statistici-dashboard">
                <div><div className="sub" style={{ margin: 0 }}>La moderare</div><strong>{s.inAsteptareModerare}</strong></div>
                <div><div className="sub" style={{ margin: 0 }}>Coadă prezentator</div><strong>{s.inCoadaPrezentator}</strong></div>
                <div><div className="sub" style={{ margin: 0 }}>Difuzate</div><strong>{s.difuzate}</strong></div>
                <div><div className="sub" style={{ margin: 0 }}>Încasări</div><strong>{lei(s.incasari)}</strong></div>
              </div>
            );
          })()}
          <div className="rand" style={{ marginTop: 14, justifyContent: 'flex-start', gap: 10 }}>
            <Link className="btn mic" href="/admin/moderare">Moderare</Link>
            <Link className="btn mic secondary" href="/admin/regie">Regie</Link>
            <Link className="btn mic secondary" href="/admin/ecrane">Ecrane</Link>
            <Link className="btn mic secondary" href={`/admin/evenimente/${live.id}`}>Editează</Link>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginTop: 28 }}>Toate edițiile</h2>
      {lista.length === 0 && <div className="card">Nicio ediție creată încă.</div>}
      {lista.map((ev) => {
        const s = statisticiEveniment(ev.id);
        return (
          <Link key={ev.id} href={`/admin/evenimente/${ev.id}`} className="card rand rand-eveniment-dashboard">
            <div>
              <span className={`badge-eveniment ${ev.status}`}>{ETICHETA_STATUS[ev.status]}</span>{' '}
              <strong>{ev.nume}</strong>
              <div className="sub" style={{ margin: '4px 0 0', textAlign: 'left' }}>
                {ev.data_show
                  ? new Date(ev.data_show).toLocaleDateString('ro-RO', { dateStyle: 'medium' })
                  : 'fără dată'}
                {' · '}{s.numarDedicatii} dedicații{' · '}{lei(s.incasari)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
