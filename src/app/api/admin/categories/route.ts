import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { loadCustomCategories, saveCustomCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = loadCustomCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    let newCategories: string[] = [];

    if (Array.isArray(body.categories)) {
      newCategories = body.categories
        .map((c: any) => String(c).trim())
        .filter((c: string) => c.length > 0);
    } else if (typeof body.category === 'string' && body.category.trim().length > 0) {
      const existing = loadCustomCategories();
      const cat = body.category.trim();
      if (!existing.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        newCategories = [...existing, cat];
      } else {
        newCategories = existing;
      }
    }

    if (newCategories.length > 0) {
      // Eliminar duplicados preservando orden
      const unique = Array.from(new Set(newCategories));
      saveCustomCategories(unique);
      return NextResponse.json({ success: true, categories: unique });
    }

    return NextResponse.json({ success: false, error: 'Lista de categorías inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error guardando categorías:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar categorías' }, { status: 500 });
  }
}
