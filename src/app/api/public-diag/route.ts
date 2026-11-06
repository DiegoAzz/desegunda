import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== 'desegunda2026') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result: any = {
    time: new Date().toISOString(),
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
    rawSqlProducts: [],
    rawSqlError: null,
    prismaProducts: [],
    prismaError: null,
    foundFiles: {},
  };

  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "Product" ORDER BY "createdAt" DESC LIMIT 50;`);
    result.rawSqlProducts = rows;
  } catch (e: any) {
    result.rawSqlError = e.message;
  }

  try {
    const prods = await prisma.product.findMany({
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
    result.prismaProducts = prods;
  } catch (e: any) {
    result.prismaError = e.message;
  }

  const candidateDirs = [
    process.env.UPLOAD_DIR,
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'uploads'),
    '/app/uploads',
    path.join(os.tmpdir(), 'lotengo_uploads'),
  ].filter(Boolean) as string[];

  for (const dir of candidateDirs) {
    try {
      if (fs.existsSync(dir)) {
        result.foundFiles[dir] = fs.readdirSync(dir);
        const jsonPath = path.join(dir, 'custom_products.json');
        if (fs.existsSync(jsonPath)) {
          result.foundFiles[`${dir}/custom_products.json`] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        }
      }
    } catch (e: any) {
      result.foundFiles[dir] = `Error: ${e.message}`;
    }
  }

  return NextResponse.json(result);
}
