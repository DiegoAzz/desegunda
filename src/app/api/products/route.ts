import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';
import { ProductType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as ProductType) || undefined;
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;

    const products = await getProducts({ type, query, category });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudieron obtener los productos' },
      { status: 500 }
    );
  }
}
