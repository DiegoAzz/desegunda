import { NextRequest, NextResponse } from 'next/server';
import { prisma, getProductBySlug, loadLocalCustomProducts } from '@/lib/db';
import { INITIAL_PRODUCTS } from '@/lib/initial-data';
import { createWompiReference, generateWompiSignature } from '@/lib/wompi';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slugToFind = (body.slug || '').trim();
    const idToFind = (body.productId || body.id || '').trim();

    if (!slugToFind && !idToFind) {
      return NextResponse.json(
        { success: false, error: 'Identificador del producto requerido' },
        { status: 400 }
      );
    }

    let product: any = null;

    // 1. Usar getProductBySlug (es exactamente la misma función que renderizó la página)
    if (slugToFind) {
      try {
        product = await getProductBySlug(slugToFind);
      } catch (err) {
        console.warn('Aviso buscando slug en getProductBySlug:', err);
      }
    }

    // 2. Si no se encontró por slug, buscar en base de datos PostgreSQL por ID o slug
    if (!product && (idToFind || slugToFind)) {
      try {
        const queryTarget = idToFind || slugToFind;
        product = await prisma.product.findFirst({
          where: {
            OR: [{ id: queryTarget }, { slug: queryTarget }],
          },
        });
      } catch (dbError) {
        console.warn('Base de datos no disponible en checkout:', dbError);
      }
    }

    // 3. Fallback a catálogo local personalizado (custom_products.json)
    if (!product) {
      const localCustom = loadLocalCustomProducts();
      product =
        localCustom.find(
          (p) =>
            (slugToFind && p.slug === slugToFind) ||
            (idToFind && p.id === idToFind) ||
            (idToFind && p.slug === idToFind)
        ) || null;
    }

    // 4. Fallback a productos semilla iniciales
    if (!product) {
      product =
        INITIAL_PRODUCTS.find(
          (p) =>
            (slugToFind && p.slug === slugToFind) ||
            (idToFind && p.id === idToFind) ||
            (idToFind && p.slug === idToFind)
        ) || null;
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Regla PRD: Regalos nunca admiten pagos
    if (product.type === 'GIFT') {
      return NextResponse.json(
        { success: false, error: 'Los regalos son 100% gratuitos y no admiten pasarelas de pago' },
        { status: 400 }
      );
    }

    // Control de inventario: verificar si ya está vendido o sin stock
    const isSoldOrReserved = product.status !== 'AVAILABLE';
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    if (isSoldOrReserved || isOutOfStock) {
      return NextResponse.json(
        {
          success: false,
          error: '¡Artículo no disponible! Este producto ya fue vendido o apartado.',
        },
        { status: 409 }
      );
    }

    if (!product.priceCop || product.priceCop <= 0) {
      return NextResponse.json(
        { success: false, error: 'El precio del artículo no es válido para compra' },
        { status: 400 }
      );
    }

    // Llave pública EXACTA de producción verificada en la API de Wompi (Comercio: APPZPLAY)
    const publicKey = (
      process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_prod_GY4Z4CsYWPa41Ax4D3BEq14Y5Q3lQUam'
    ).trim();

    const integritySecret = (
      process.env.WOMPI_INTEGRITY_SECRET || 'prod_integrity_wWDwKGW5r3VzaUmGA61XgXBAPGOYqpNk'
    ).trim();

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://desegunda.appzplay.online').replace(/\/$/, '');

    const amountInCents = product.priceCop * 100;
    const reference = createWompiReference(product.slug || product.id);
    const signature = generateWompiSignature(reference, amountInCents, 'COP', integritySecret);
    const redirectUrl = `${siteUrl}/p/${product.slug}?wompi_ref=${reference}`;

    const params = new URLSearchParams({
      'public-key': publicKey,
      currency: 'COP',
      'amount-in-cents': amountInCents.toString(),
      reference,
      'signature:integrity': signature,
      'redirect-url': redirectUrl,
    });

    const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}`;

    return NextResponse.json({
      success: true,
      publicKey,
      currency: 'COP',
      amountInCents,
      reference,
      signature,
      redirectUrl,
      checkoutUrl,
      productTitle: product.title,
    });
  } catch (error: any) {
    console.error('Error generando checkout de Wompi:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la pasarela de Wompi' },
      { status: 500 }
    );
  }
}
