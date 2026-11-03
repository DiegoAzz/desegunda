import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const transaction = event?.data?.transaction;

    if (!transaction) {
      return NextResponse.json({ received: true, note: 'No transaction data' });
    }

    const { id: txId, status, reference } = transaction;
    console.log(`[Wompi Webhook] Transacción ${txId} - Estado: ${status} - Ref: ${reference}`);

    // Si la transacción fue aprobada, actualizar el inventario y marcar como VENDIDO
    if (status === 'APPROVED' && reference) {
      const parts = reference.split('-');
      const refCode = parts.length > 1 ? parts[1] : '';

      const products = await prisma.product.findMany({
        where: {
          type: { in: ['NEW', 'USED'] },
        },
      });

      const matchedProduct = products.find((p) => {
        const cleanId = p.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
        return cleanId.toLowerCase() === refCode.toLowerCase() || p.slug.includes(refCode.toLowerCase());
      });

      if (matchedProduct) {
        const currentStock = matchedProduct.stock ?? 1;
        const newStock = Math.max(0, currentStock - 1);

        await prisma.product.update({
          where: { id: matchedProduct.id },
          data: {
            stock: newStock,
            status: newStock === 0 ? 'SOLD' : 'AVAILABLE',
          },
        });
        console.log(
          `[Wompi Webhook] Inventario actualizado para «${matchedProduct.title}»: Stock restante: ${newStock}, Estado: ${
            newStock === 0 ? 'VENDIDO' : 'DISPONIBLE'
          }`
        );
      }
    }

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error) {
    console.error('[Wompi Webhook Error]:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
