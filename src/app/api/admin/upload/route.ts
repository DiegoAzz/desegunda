import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB para fotos
const MAX_VIDEO_SIZE = 35 * 1024 * 1024; // 35 MB para videos cortos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

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

    const fileNameLower = (file.name || '').toLowerCase();
    const isVideo =
      file.type.startsWith('video/') ||
      ALLOWED_VIDEO_TYPES.includes(file.type) ||
      /\.(mp4|webm|mov|m4v)$/i.test(fileNameLower);

    // 1. MANEJO DE VIDEOS CORTOS
    if (isVideo) {
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { success: false, error: 'El video excede el límite permitido de 35 MB' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name || '.mp4') || '.mp4';
      const videoFileName = `video-${crypto.randomBytes(12).toString('hex')}${ext.toLowerCase()}`;

      const candidateDirs = [
        process.env.UPLOAD_DIR,
        path.join(process.cwd(), 'public', 'uploads'),
        path.join(process.cwd(), 'uploads'),
        '/app/uploads',
        path.join(os.tmpdir(), 'lotengo_uploads'),
      ].filter(Boolean) as string[];

      let saved = false;
      for (const dir of candidateDirs) {
        try {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
          }
          fs.writeFileSync(path.join(dir, videoFileName), buffer);
          saved = true;
        } catch {}
      }

      if (!saved) {
        return NextResponse.json(
          { success: false, error: 'No se pudo guardar el archivo de video en el servidor' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        url: `/api/uploads/${videoFileName}`,
        isVideo: true,
        fileName: videoFileName,
      });
    }

    // 2. MANEJO DE FOTOGRAFÍAS
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'La imagen excede el límite permitido (15 MB)' },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato no permitido. Solo se aceptan imágenes JPEG, PNG o WebP, o videos MP4' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validar tipo real con Sharp (previene archivos maliciosos renombrados)
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp', 'heif', 'tiff'].includes(metadata.format)) {
      return NextResponse.json(
        { success: false, error: 'El archivo no es una imagen válida' },
        { status: 400 }
      );
    }

    // Comprimir a WebP de alta definición y peso ultra-liviano (30KB-70KB)
    const processedBuffer = await sharp(buffer)
      .rotate() // Respeta orientación EXIF de celulares
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 1 })
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
      isVideo: false,
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
