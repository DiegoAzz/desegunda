import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma, getStoreSettings, saveStoreSettingsToLocalFile } from '@/lib/db';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error obteniendo ajustes:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { storeName, tagline, whatsappNumber, defaultDeliveryArea } = data;

    const normalizedPhone = normalizeWhatsAppNumber(whatsappNumber);

    const updatedSettings = {
      id: 'default',
      storeName: (storeName || 'LO TENGO').trim(),
      tagline: (tagline || 'Cosas buenas para alguien más.').trim(),
      whatsappNumber: normalizedPhone,
      defaultDeliveryArea: (defaultDeliveryArea || 'Bogotá, Colombia').trim(),
      logoPath: null,
    };

    // 1. Guardar en archivo local resiliente
    saveStoreSettingsToLocalFile(updatedSettings);

    // 2. Intentar guardar en base de datos PostgreSQL
    try {
      await prisma.storeSettings.upsert({
        where: { id: 'default' },
        update: {
          storeName: updatedSettings.storeName,
          tagline: updatedSettings.tagline,
          whatsappNumber: updatedSettings.whatsappNumber,
          defaultDeliveryArea: updatedSettings.defaultDeliveryArea,
        },
        create: {
          id: 'default',
          storeName: updatedSettings.storeName,
          tagline: updatedSettings.tagline,
          whatsappNumber: updatedSettings.whatsappNumber,
          defaultDeliveryArea: updatedSettings.defaultDeliveryArea,
        },
      });
    } catch (dbErr) {
      console.warn('Aviso guardando ajustes en BD (guardado en archivo híbrido):', dbErr);
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Error guardando ajustes:', error);
    return NextResponse.json({ success: false, error: 'Error al guardar ajustes' }, { status: 500 });
  }
}
