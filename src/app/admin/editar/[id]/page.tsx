import { getSession } from '@/lib/auth';
import { prisma, getStoreSettings, loadLocalCustomProducts } from '@/lib/db';
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

  let product: any = null;
  try {
    product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  } catch {}

  if (!product) {
    const localList = loadLocalCustomProducts();
    product = localList.find((p) => p.id === params.id || p.slug === params.id) || null;
  }

  const settings = await getStoreSettings();

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
