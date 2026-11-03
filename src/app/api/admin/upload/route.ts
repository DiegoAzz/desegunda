import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';
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

    // Generar nombre seguro y aleatorio con extensión .webp para optimización máxima
    const randomName = `${crypto.randomBytes(16).toString('hex')}.webp`;

    // Procesar y comprimir imagen con Sharp
    const processedBuffer = await sharp(buffer)
      .rotate() // Respeta orientación EXIF de celulares
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Directorios donde intentar guardar (para máxima resiliencia en Docker/Coolify)
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    let saveCount = 0;
    for (const dir of candidateDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
        }
        const targetPath = path.join(dir, randomName);
        fs.writeFileSync(targetPath, processedBuffer);
        saveCount++;
      } catch (writeErr) {
        console.warn(`[upload] No se pudo escribir en ${dir}:`, writeErr);
      }
    }

    if (saveCount === 0) {
      throw new Error('No se pudo guardar la imagen en ningún directorio del sistema de archivos');
    }

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
