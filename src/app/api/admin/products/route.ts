import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/format';
import { ProductType, ProductCondition, ProductStatus } from '@/lib/types';
import fs from 'fs';
import path from 'path';

import os from 'os';

export const dynamic = 'force-dynamic';

function saveProductToLocalFile(product: any) {
  try {
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    for (const dir of candidateDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'custom_products.json');
        let existing: any[] = [];
        if (fs.existsSync(filePath)) {
          try {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch {
            existing = [];
          }
        }
        existing = [product, ...existing.filter((p) => p.id !== product.id && p.slug !== product.slug)];
        fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
      } catch (dirErr) {
        // Continuar con el siguiente directorio
      }
    }
  } catch (err) {
    console.error('Error guardando en archivo local:', err);
  }
}

export async function POST(req: NextRequest) {
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
      status = 'AVAILABLE',
      deliveryArea,
      images = [],
    } = data;

    // Validaciones
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (title.length > 90) {
      return NextResponse.json({ success: false, error: 'El nombre no puede exceder 90 caracteres' }, { status: 400 });
    }
    if (!['NEW', 'USED', 'GIFT'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
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
          { success: false, error: 'Para publicar una venta se requiere un precio mayor que cero' },
          { status: 400 }
        );
      }
      finalPriceCop = parsedPrice;
      finalAcceptsOffers = Boolean(acceptsOffers);
    }

    let finalCondition: ProductCondition | null = null;
    let finalDamageDetails: string | null = null;

    if (type === 'USED') {
      if (!['GOOD', 'DETAILS', 'DAMAGED'].includes(condition)) {
        return NextResponse.json(
          { success: false, error: 'En artículos usados debes elegir si funciona bien, tiene detalles o está dañado' },
          { status: 400 }
        );
      }
      finalCondition = condition as ProductCondition;

      if (finalCondition === 'DAMAGED') {
        if (!damageDetails || damageDetails.trim().length < 5) {
          return NextResponse.json(
            { success: false, error: 'Para artículos dañados es obligatorio detallar claramente la falla' },
            { status: 400 }
          );
        }
        finalDamageDetails = damageDetails.trim();
      }
    }

    const parsedStock = Math.max(0, parseInt(stock, 10) || 1);
    let finalStatus: ProductStatus = (status as ProductStatus) || 'AVAILABLE';
    if (parsedStock === 0 && finalStatus === 'AVAILABLE') {
      finalStatus = 'SOLD';
    }

    const uniqueSlug = slugify(title);
    const productId = `prod-${Date.now()}`;

    const productPayload = {
      id: productId,
      slug: uniqueSlug,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: images.map((img: { storagePath: string; altText?: string }, index: number) => ({
        id: `img-${Date.now()}-${index}`,
        productId,
        storagePath: img.storagePath,
        sortOrder: index,
        altText: img.altText || title,
      })),
    };

    // Intentar guardar en PostgreSQL
    let createdInDb = false;
    try {
      // Si la columna stock no existía, intentar auto-migrar de forma transparente
      try {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 1;'
        );
      } catch {
        // Ignorar si ya existe o no se tienen permisos DDL
      }

      await prisma.product.create({
        data: {
          slug: uniqueSlug,
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
          images: {
            create: images.map((img: { storagePath: string; altText?: string }, index: number) => ({
              storagePath: img.storagePath,
              sortOrder: index,
              altText: img.altText || title,
            })),
          },
        },
      });
      createdInDb = true;
    } catch (dbErr: any) {
      console.warn('PostgreSQL no disponible o error al insertar, guardando en respaldo local:', dbErr?.message);
    }

    // Siempre guardar en el archivo local de respaldo persistente para garantizar 100% disponibilidad
    saveProductToLocalFile(productPayload);

    return NextResponse.json({ success: true, product: productPayload, savedInDb: createdInDb });
  } catch (error: any) {
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al crear el producto' },
      { status: 500 }
    );
  }
}
