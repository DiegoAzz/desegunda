import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createWompiReference, generateWompiSignature } from '@/lib/wompi';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ success: false, error: 'ID de producto requerido' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    // Regla PRD: Regalos nunca admiten pagos
    if (product.type === 'GIFT') {
      return NextResponse.json(
        { success: false, error: 'Los regalos son 100% gratuitos y no admiten pasarelas de pago' },
        { status: 400 }
      );
    }

    // CONTROL ESTRICTO DE INVENTARIO: Nunca permitir pago si no está disponible o stock es 0
    if (product.status !== 'AVAILABLE' || (product.stock !== undefined && product.stock <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: '¡Artículo no disponible! Este producto ya fue vendido o apartado y no tiene unidades disponibles.',
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

    const publicKey =
      process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_prod_GY4Z4CsYWPa41Ax4D3BEq14Y5Q3lQUam';
    const integritySecret =
      process.env.WOMPI_INTEGRITY_SECRET || 'prod_integrity_wWDwKGW5r3VzaUmGA61XgXBAPGOYqpNk';
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://desegunda.appzplay.online').replace(/\/$/, '');

    const amountInCents = product.priceCop * 100;
    const reference = createWompiReference(product.id);
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
      checkoutUrl,
      reference,
      amountInCents,
      productTitle: product.title,
    });
  } catch (error) {
    console.error('Error generando checkout de Wompi:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar la pasarela de Wompi' },
      { status: 500 }
    );
  }
}
