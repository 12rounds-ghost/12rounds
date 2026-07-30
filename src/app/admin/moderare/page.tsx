import { cereRol } from '@/lib/auth-admin';
import { ModerareClient } from '@/components/admin/ModerareClient';

export default async function ModerarePage() {
  await cereRol(['admin', 'moderator']);
  return <ModerareClient />;
}
