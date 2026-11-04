import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma, removeProductFromLocalFile, markProductAsDeleted, unmarkProductAsDeleted, saveProductToLocalFile } from '@/lib/db';
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

    // 1. Buscar el producto por id o slug
    let existing: any = null;
    try {
      existing = await prisma.product.findFirst({
        where: {
          OR: [{ id: params.id }, { slug: params.id }],
        },
      });
    } catch {}

    const targetDbId = existing?.id || params.id;

    // Actualizar producto e imágenes en PostgreSQL
    try {
      await prisma.$transaction(async (tx) => {
        await tx.product.upsert({
          where: { id: targetDbId },
          update: {
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
          create: {
            id: targetDbId,
            slug: existing?.slug || params.id,
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
          await tx.productImage.deleteMany({ where: { productId: targetDbId } });
          await tx.productImage.createMany({
            data: images.map((img: { storagePath: string; altText?: string }, index: number) => ({
              productId: targetDbId,
              storagePath: img.storagePath,
              sortOrder: index,
              altText: img.altText || title,
            })),
          });
        }
      });
    } catch (dbErr) {
      console.warn('Aviso actualizando producto en BD:', dbErr);
    }

    // Persistir en archivo local híbrido
    const updatedPayload = {
      id: targetDbId,
      slug: existing?.slug || params.id,
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
      updatedAt: new Date().toISOString(),
      images: images.map((img: any, idx: number) => ({
        id: `img-${targetDbId}-${idx}`,
        productId: targetDbId,
        storagePath: img.storagePath,
        sortOrder: idx,
        altText: img.altText || title.trim(),
      })),
    };
    saveProductToLocalFile(updatedPayload);

    // Desmarcar de lista de eliminados si existía
    unmarkProductAsDeleted(targetDbId);
    unmarkProductAsDeleted(params.id);
    if (existing?.slug) unmarkProductAsDeleted(existing.slug);

    return NextResponse.json({ success: true, product: updatedPayload });
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
    let targetSlug = '';
    let dbId = targetId;

    try {
      const prod = await prisma.product.findFirst({
        where: {
          OR: [{ id: targetId }, { slug: targetId }],
        },
      });
      if (prod) {
        dbId = prod.id;
        targetSlug = prod.slug;
      }
    } catch {}

    // 1. Eliminar imágenes asociadas en PostgreSQL
    try {
      await prisma.productImage.deleteMany({
        where: {
          OR: [
            { productId: dbId },
            { productId: targetId },
            ...(targetSlug ? [{ product: { slug: targetSlug } }] : []),
          ],
        },
      });
    } catch {}

    // 2. Eliminar producto en PostgreSQL (por id o slug de forma segura)
    try {
      await prisma.product.deleteMany({
        where: {
          OR: [
            { id: dbId },
            { id: targetId },
            { slug: targetId },
            ...(targetSlug ? [{ slug: targetSlug }] : []),
          ],
        },
      });
    } catch (dbErr) {
      console.warn('Aviso eliminando de base de datos:', dbErr);
    }

    // 3. Eliminar de archivo local si existía allí
    removeProductFromLocalFile(targetId);
    if (dbId !== targetId) removeProductFromLocalFile(dbId);
    if (targetSlug) removeProductFromLocalFile(targetSlug);

    // 4. Registrar en lista negra de eliminados
    markProductAsDeleted(targetId);
    if (dbId !== targetId) markProductAsDeleted(dbId);
    if (targetSlug) markProductAsDeleted(targetSlug);

    // 5. Purgar demos completamente si coincide
    const DEMO_ITEMS = [
      'audifonos-bluetooth-soundcore-a20-x89k2',
      'monitor-dell-24-pulgadas-ips-hdmi-m391z',
      'licuadora-oster-clasica-motor-100-l823a',
      'coleccion-enciclopedia-y-novelas-g190d',
      'prod-new-001',
      'prod-used-002',
      'prod-used-003',
      'prod-gift-004',
      'sample-audifonos-1',
      'sample-monitor-2',
      'sample-licuadora-3',
      'sample-libros-4',
    ];
    if (DEMO_ITEMS.includes(targetId) || DEMO_ITEMS.includes(targetSlug)) {
      DEMO_ITEMS.forEach(markProductAsDeleted);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar producto' }, { status: 500 });
  }
}
