import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProductType, ProductCondition, ProductStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const {
      title,
      description,
      type,
      category,
      condition,
      damageDetails,
      priceCop,
      acceptsOffers,
      status,
      deliveryArea,
      images = [],
    } = data;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    let finalPriceCop: number | null = null;
    let finalAcceptsOffers = false;

    if (type === 'GIFT') {
      finalPriceCop = null;
      finalAcceptsOffers = false;
    } else {
      const parsedPrice = parseInt(priceCop, 10);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'Para una venta se requiere un precio mayor que cero' },
          { status: 400 }
        );
      }
      finalPriceCop = parsedPrice;
      finalAcceptsOffers = Boolean(acceptsOffers);
    }

    let finalCondition: ProductCondition | null = null;
    let finalDamageDetails: string | null = null;

    if (type === 'USED') {
      finalCondition = condition as ProductCondition;
      if (finalCondition === 'DAMAGED') {
        if (!damageDetails || damageDetails.trim().length < 5) {
          return NextResponse.json(
            { success: false, error: 'Para artículos dañados es obligatorio detallar la falla' },
            { status: 400 }
          );
        }
        finalDamageDetails = damageDetails.trim();
      }
    }

    // Actualizar producto e imágenes
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: params.id },
        data: {
          title: title.trim(),
          description: (description || '').trim(),
          type: type as ProductType,
          category: category || 'Otros',
          condition: finalCondition,
          damageDetails: finalDamageDetails,
          priceCop: finalPriceCop,
          acceptsOffers: finalAcceptsOffers,
          status: (status as ProductStatus) || 'AVAILABLE',
          deliveryArea: deliveryArea ? deliveryArea.trim() : null,
        },
      });

      if (images && images.length > 0) {
        await tx.productImage.deleteMany({ where: { productId: params.id } });
        await tx.productImage.createMany({
          data: images.map((img: { storagePath: string; altText?: string }, index: number) => ({
            productId: params.id,
            storagePath: img.storagePath,
            sortOrder: index,
            altText: img.altText || title,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar producto' }, { status: 500 });
  }
}
