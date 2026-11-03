import { getSession } from '@/lib/auth';
import { prisma, getStoreSettings } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import ProductForm from '../../ProductForm';

export const dynamic = 'force-dynamic';

interface AdminEditarPageProps {
  params: {
    id: string;
  };
}

export default async function AdminEditarPage({ params }: AdminEditarPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    getStoreSettings(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialData={product}
      defaultDeliveryArea={settings.defaultDeliveryArea}
      isEdit={true}
    />
  );
}
