import { getSession } from '@/lib/auth';
import { prisma, getStoreSettings, loadLocalCustomProducts, loadDeletedProductIds } from '@/lib/db';
import { INITIAL_PRODUCTS } from '@/lib/initial-data';
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

  if (!product) {
    const deletedIds = loadDeletedProductIds();
    const fromInitial = INITIAL_PRODUCTS.find((p) => p.id === params.id || p.slug === params.id);
    if (fromInitial && !deletedIds.includes(fromInitial.id) && !deletedIds.includes(fromInitial.slug)) {
      product = fromInitial;
    }
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
