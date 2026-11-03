import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { storeName, tagline, whatsappNumber, defaultDeliveryArea } = data;

    const normalizedPhone = normalizeWhatsAppNumber(whatsappNumber);

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        storeName: storeName || 'LO TENGO',
        tagline: tagline || 'Cosas buenas para alguien más.',
        whatsappNumber: normalizedPhone,
        defaultDeliveryArea: defaultDeliveryArea || 'Bogotá, Colombia',
      },
      create: {
        id: 'default',
        storeName: storeName || 'LO TENGO',
        tagline: tagline || 'Cosas buenas para alguien más.',
        whatsappNumber: normalizedPhone,
        defaultDeliveryArea: defaultDeliveryArea || 'Bogotá, Colombia',
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error guardando ajustes:', error);
    return NextResponse.json({ success: false, error: 'Error al guardar ajustes' }, { status: 500 });
  }
}
