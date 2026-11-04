import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma, loadLocalCustomProducts, saveProductToLocalFile } from '@/lib/db';
import { INITIAL_PRODUCTS } from '@/lib/initial-data';
import { ProductStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { status } = await req.json();

    if (!['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'GIVEN_AWAY', 'HIDDEN'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
    }

    const targetId = params.id;
    let updatedInDb = false;

    // 1. Intentar actualizar en PostgreSQL
    try {
      await prisma.product.updateMany({
        where: {
          OR: [{ id: targetId }, { slug: targetId }],
        },
        data: { status: status as ProductStatus },
      });
      updatedInDb = true;
    } catch (dbErr) {
      console.warn('Aviso actualizando estado en BD:', dbErr);
    }

    // 2. Actualizar o persistir en catálogo local híbrido
    const localCustom = loadLocalCustomProducts();
    const existingLocal = localCustom.find((p) => p.id === targetId || p.slug === targetId);
    if (existingLocal) {
      existingLocal.status = status as ProductStatus;
      saveProductToLocalFile(existingLocal);
    } else {
      // Si era un producto inicial semilla, guardarlo con su nuevo estado
      const seedProduct = INITIAL_PRODUCTS.find((p) => p.id === targetId || p.slug === targetId);
      if (seedProduct) {
        const cloned = { ...seedProduct, status: status as ProductStatus };
        saveProductToLocalFile(cloned);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    return NextResponse.json({ success: false, error: 'Error al cambiar estado' }, { status: 500 });
  }
}
