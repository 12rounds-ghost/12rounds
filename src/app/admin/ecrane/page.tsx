import { cereRol } from '@/lib/auth-admin';
import { EcraneClient } from '@/components/admin/EcraneClient';

export default async function EcraneAdminPage() {
  await cereRol(['admin']);

  const secret = process.env.ECRAN_SECRET ?? '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return <EcraneClient ecranSecret={secret} siteUrl={siteUrl} />;
}
