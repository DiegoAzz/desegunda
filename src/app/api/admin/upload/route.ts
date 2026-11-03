import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'La imagen excede el límite de 5 MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato no permitido. Solo se aceptan JPEG, PNG y WebP' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validar tipo real con Sharp (previene archivos maliciosos renombrados a .jpg)
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
      return NextResponse.json(
        { success: false, error: 'El contenido del archivo no es una imagen válida' },
        { status: 400 }
      );
    }

    // Configurar directorio persistente
    const uploadBaseDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadBaseDir)) {
      fs.mkdirSync(uploadBaseDir, { recursive: true });
    }

    // Generar nombre seguro y aleatorio con extensión .webp para optimización máxima
    const randomName = `${crypto.randomBytes(16).toString('hex')}.webp`;
    const targetPath = path.join(uploadBaseDir, randomName);

    // Comprimir y redimensionar con Sharp (máximo 1600px de ancho para celular y alta calidad)
    await sharp(buffer)
      .rotate() // Respeta orientación EXIF de celulares
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(targetPath);

    // Ruta pública para servir la imagen
    const publicUrl = `/api/uploads/${randomName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: randomName,
    });
  } catch (error) {
    console.error('Error procesando imagen:', error);
    return NextResponse.json(
      { success: false, error: 'Error procesando la imagen' },
      { status: 500 }
    );
  }
}
