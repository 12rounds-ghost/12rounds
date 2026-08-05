import { cereRol } from '@/lib/auth-admin';
import { EcraneClient } from '@/components/admin/EcraneClient';

export default async function EcraneAdminPage() {
  await cereRol(['admin']);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return <EcraneClient siteUrl={siteUrl} />;
}
