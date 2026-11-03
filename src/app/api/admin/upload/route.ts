import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6 MB
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
        { success: false, error: 'La imagen excede el límite de 6 MB' },
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

    // Validar tipo real con Sharp (previene archivos maliciosos renombrados)
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
      return NextResponse.json(
        { success: false, error: 'El archivo no es una imagen válida' },
        { status: 400 }
      );
    }

    // Comprimir a WebP de alta definición y peso ultra-liviano (30KB-70KB)
    const processedBuffer = await sharp(buffer)
      .rotate() // Respeta orientación EXIF de celulares
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();

    // Data URI Base64: garantía 100% permanente de que nunca se perderá en reinicios de contenedores
    const base64DataUri = `data:image/webp;base64,${processedBuffer.toString('base64')}`;

    // Intentar también guardar en disco para redundancia
    const randomName = `${crypto.randomBytes(16).toString('hex')}.webp`;
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
          fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
        }
        fs.writeFileSync(path.join(dir, randomName), processedBuffer);
      } catch {
        // Tolerante: si el disco del contenedor no permite escritura, el Data URI sigue funcionando
      }
    }

    return NextResponse.json({
      success: true,
      url: base64DataUri,
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
