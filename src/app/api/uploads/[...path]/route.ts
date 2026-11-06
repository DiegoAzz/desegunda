import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params?: { path?: string | string[] } }
) {
  try {
    // 1. Obtener el nombre del archivo de forma tolerante a arrays, strings o params vacíos
    let rawPath = '';
    const params = context?.params;

    if (params?.path) {
      if (Array.isArray(params.path)) {
        rawPath = params.path.join('/');
      } else if (typeof params.path === 'string') {
        rawPath = params.path;
      }
    }

    if (!rawPath) {
      // Extraer directamente del pathname de la URL si context.params fue omitido
      const pathname = req.nextUrl?.pathname || '';
      const match = pathname.match(/\/api\/uploads\/(.+)$/);
      if (match) {
        rawPath = decodeURIComponent(match[1]);
      }
    }

    if (!rawPath) {
      return new NextResponse('Ruta de archivo no especificada', { status: 400 });
    }

    // Sanitización estricta contra Path Traversal
    const safePath = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
    if (safePath.includes('..')) {
      return new NextResponse('Acceso no permitido', { status: 403 });
    }

    // 2. Buscar en todos los posibles directorios de persistencia
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    let targetFilePath = '';
    for (const dir of candidateDirs) {
      const p = path.join(dir, safePath);
      if (fs.existsSync(p)) {
        targetFilePath = p;
        break;
      }
    }

    if (!targetFilePath) {
      console.warn(`[uploads] Archivo no encontrado: ${safePath}. Directorios inspeccionados:`, candidateDirs);
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }

    const ext = path.extname(targetFilePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.m4v': 'video/mp4',
      '.ogg': 'video/ogg',
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    const stat = fs.statSync(targetFilePath);
    const fileSize = stat.size;
    const range = req.headers.get('range');

    // Soporte para HTTP Range (indispensable para reproducir y avanzar videos en iPhone y navegadores modernos)
    if (range && contentType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileStream = fs.createReadStream(targetFilePath, { start, end });
      // Convertir readstream a web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      });
    }

    const fileBuffer = fs.readFileSync(targetFilePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error al servir archivo:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
