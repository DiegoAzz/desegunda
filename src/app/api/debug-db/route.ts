import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: any = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    candidateDirs: {},
    rawProducts: [],
    prismaError: null,
    dbColumns: [],
  };

  // 1. Revisar archivos en todas las carpetas candidatas
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
        const files = fs.readdirSync(dir);
        result.candidateDirs[dir] = files;
        const customProdFile = path.join(dir, 'custom_products.json');
        if (fs.existsSync(customProdFile)) {
          try {
            result.candidateDirs[`${dir}/custom_products.json`] = JSON.parse(
              fs.readFileSync(customProdFile, 'utf-8')
            );
          } catch (e: any) {
            result.candidateDirs[`${dir}/custom_products.json_error`] = e.message;
          }
        }
      }
    } catch (err: any) {
      result.candidateDirs[dir] = `Error: ${err.message}`;
    }
  }

  // 2. Intentar consultar PostgreSQL directamente con raw SQL
  try {
    const raw: any = await prisma.$queryRawUnsafe(`SELECT * FROM "Product" LIMIT 50;`);
    result.rawProducts = raw;
  } catch (err: any) {
    result.rawError = err.message;
  }

  // 3. Intentar consultar con Prisma ORM
  try {
    const orm = await prisma.product.findMany();
    result.prismaOrmCount = orm.length;
    result.prismaOrmProducts = orm;
  } catch (err: any) {
    result.prismaError = err.message;
  }

  return NextResponse.json(result);
}
