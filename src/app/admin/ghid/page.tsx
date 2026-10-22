import { cereRol } from '@/lib/auth-admin';
import { GhidViewer } from '@/components/admin/GhidViewer';

export const dynamic = 'force-dynamic';

// Ghidul de administrare e deschis oricarui rol din echipa (admin, moderator,
// operator) — nu contine date, doar explicatii despre cum se foloseste panoul.
export default async function GhidPage() {
  await cereRol(['admin', 'moderator', 'operator']);
  return <GhidViewer />;
}
