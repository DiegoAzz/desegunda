import { getSession } from '@/lib/auth';
import { getStoreSettings } from '@/lib/db';
import { redirect } from 'next/navigation';
import ProductForm from '../ProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminNuevoPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  const settings = await getStoreSettings();

  return (
    <ProductForm defaultDeliveryArea={settings.defaultDeliveryArea} />
  );
}
