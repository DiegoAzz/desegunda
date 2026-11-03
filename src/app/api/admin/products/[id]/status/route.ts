import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
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

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: { status: status as ProductStatus },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    return NextResponse.json({ success: false, error: 'Error al cambiar estado' }, { status: 500 });
  }
}
