import { cereRol } from '@/lib/auth-admin';
import { RegieClient } from '@/components/admin/RegieClient';

export default async function RegiePage() {
  await cereRol(['admin', 'operator']);
  return <RegieClient />;
}
