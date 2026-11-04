import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma, removeProductFromLocalFile, markProductAsDeleted } from '@/lib/db';
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
      stock = 1,
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

    const parsedStock = Math.max(0, parseInt(stock, 10) ?? 1);
    let finalStatus: ProductStatus = (status as ProductStatus) || 'AVAILABLE';
    if (parsedStock === 0 && finalStatus === 'AVAILABLE') {
      finalStatus = 'SOLD';
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
          stock: parsedStock,
          acceptsOffers: finalAcceptsOffers,
          status: finalStatus,
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

    const targetId = params.id;

    // 1. Eliminar imágenes asociadas en PostgreSQL
    try {
      await prisma.productImage.deleteMany({
        where: { productId: targetId },
      });
    } catch {}

    // 2. Eliminar producto en PostgreSQL (por id o slug de forma segura)
    try {
      await prisma.product.deleteMany({
        where: {
          OR: [{ id: targetId }, { slug: targetId }],
        },
      });
    } catch (dbErr) {
      console.warn('Aviso eliminando de base de datos:', dbErr);
    }

    // 3. Eliminar de archivo local si existía allí
    removeProductFromLocalFile(targetId);

    // 4. Registrar en lista negra de eliminados para que INITIAL_PRODUCTS nunca lo vuelva a mostrar
    markProductAsDeleted(targetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar producto' }, { status: 500 });
  }
}
