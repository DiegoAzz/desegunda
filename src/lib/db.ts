import { PrismaClient } from '@prisma/client';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from './initial-data';
import { ProductItem, ProductType, StoreSettingsItem } from './types';
import fs from 'fs';
import path from 'path';
import os from 'os';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export function loadLocalCustomProducts(): ProductItem[] {
  try {
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    for (const dir of candidateDirs) {
      const filePath = path.join(dir, 'custom_products.json');
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        } catch {}
      }
    }
  } catch {
    // Si no existe o hay error, continuar sin problemas
  }
  return [];
}

export function saveProductToLocalFile(product: any) {
  try {
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
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'custom_products.json');
        let existing: any[] = [];
        if (fs.existsSync(filePath)) {
          try {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch {
            existing = [];
          }
        }
        existing = [product, ...existing.filter((p) => p.id !== product.id && p.slug !== product.slug)];
        fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
      } catch {}
    }
  } catch (err) {
    console.error('Error guardando en archivo local:', err);
  }
}

export function removeProductFromLocalFile(idOrSlug: string) {
  try {
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    for (const dir of candidateDirs) {
      const filePath = path.join(dir, 'custom_products.json');
      if (fs.existsSync(filePath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(existing)) {
            const filtered = existing.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug);
            fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Error removiendo de archivo local:', err);
  }
}

export function markProductAsDeleted(idOrSlug: string) {
  try {
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
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'deleted_ids.json');
        let existing: string[] = [];
        if (fs.existsSync(filePath)) {
          try {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch {}
        }
        if (!existing.includes(idOrSlug)) {
          existing.push(idOrSlug);
          fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
        }
      } catch {}
    }
  } catch (err) {
    console.error('Error marcando producto eliminado:', err);
  }
}

export function unmarkProductAsDeleted(idOrSlug: string) {
  try {
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    for (const dir of candidateDirs) {
      const filePath = path.join(dir, 'deleted_ids.json');
      if (fs.existsSync(filePath)) {
        try {
          const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(list)) {
            const filtered = list.filter((id) => id !== idOrSlug);
            fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Error desmarcando producto eliminado:', err);
  }
}

export function loadDeletedProductIds(): string[] {
  try {
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    for (const dir of candidateDirs) {
      const filePath = path.join(dir, 'deleted_ids.json');
      if (fs.existsSync(filePath)) {
        try {
          const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(list)) {
            return list;
          }
        } catch {}
      }
    }
  } catch {}
  return [];
}

export function loadLocalStoreSettings(): StoreSettingsItem | null {
  try {
    const candidateDirs = [
      process.env.UPLOAD_DIR,
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      '/app/uploads',
      path.join(os.tmpdir(), 'lotengo_uploads'),
    ].filter(Boolean) as string[];

    for (const dir of candidateDirs) {
      const filePath = path.join(dir, 'custom_settings.json');
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (data && data.storeName) {
            return data;
          }
        } catch {}
      }
    }
  } catch {}
  return null;
}

export function saveStoreSettingsToLocalFile(settings: StoreSettingsItem) {
  try {
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
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, 'custom_settings.json');
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
      } catch {}
    }
  } catch (err) {
    console.error('Error guardando ajustes en archivo local:', err);
  }
}

/**
 * Obtiene los ajustes de la tienda
 */
export async function getStoreSettings(): Promise<StoreSettingsItem> {
  const localSettings = loadLocalStoreSettings();

  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });
    if (settings) {
      return {
        id: settings.id,
        storeName: settings.storeName,
        tagline: settings.tagline,
        whatsappNumber: settings.whatsappNumber,
        defaultDeliveryArea: settings.defaultDeliveryArea,
        logoPath: settings.logoPath,
      };
    }
  } catch {
    // Usar datos locales si la BD no está disponible
  }

  return localSettings || INITIAL_STORE_SETTINGS;
}

export interface GetProductsFilter {
  type?: ProductType;
  query?: string;
  category?: string;
  includeUnavailable?: boolean;
}

/**
 * Obtiene la lista de productos con filtros combinando BD y respaldo local
 */
export async function getProducts(filter: GetProductsFilter = {}): Promise<ProductItem[]> {
  const { type, query, category, includeUnavailable = false } = filter;
  const localCustom = loadLocalCustomProducts();

  let dbProducts: ProductItem[] = [];

  try {
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    if (!includeUnavailable) {
      whereClause.status = {
        in: ['AVAILABLE', 'RESERVED'],
      };
    }

    if (query && query.trim()) {
      whereClause.title = {
        contains: query.trim(),
        mode: 'insensitive',
      };
    }

    const items = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (items && items.length > 0) {
      dbProducts = items.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        type: p.type as ProductType,
        category: p.category,
        condition: p.condition as any,
        damageDetails: p.damageDetails,
        priceCop: p.priceCop,
        stock: p.stock ?? 1,
        acceptsOffers: p.acceptsOffers,
        status: p.status as any,
        deliveryArea: p.deliveryArea,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        images: p.images.map((img) => ({
          id: img.id,
          productId: img.productId,
          storagePath: img.storagePath,
          sortOrder: img.sortOrder,
          altText: img.altText,
        })),
      }));
    }
  } catch {
    // Si falla la BD, usamos catálogo local
  }

  const deletedIds = loadDeletedProductIds();

  // Mapear combinando PostgreSQL y catálogo local sin duplicados
  const productMap = new Map<string, ProductItem>();
  for (const p of dbProducts) {
    productMap.set(p.id, p);
    if (p.slug) productMap.set(p.slug, p);
  }
  for (const p of localCustom) {
    if (!productMap.has(p.id) && !productMap.has(p.slug)) {
      productMap.set(p.id, p);
    }
  }

  let list = Array.from(new Set(productMap.values()));

  // Filtrar productos eliminados por el administrador
  if (deletedIds.length > 0) {
    list = list.filter((p) => !deletedIds.includes(p.id) && !deletedIds.includes(p.slug));
  }

  // Filtrar solo disponibles para la tienda pública si no se solicita todo
  if (!includeUnavailable) {
    list = list.filter((p) => p.status === 'AVAILABLE' || p.status === 'RESERVED');
  }

  if (type) {
    list = list.filter((p) => p.type === type);
  }

  if (category) {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Obtiene un producto individual por su slug
 */
export async function getProductBySlug(slug: string): Promise<ProductItem | null> {
  const deletedIds = loadDeletedProductIds();
  if (deletedIds.includes(slug)) {
    return null;
  }

  const localCustom = loadLocalCustomProducts();
  const fromLocal = localCustom.find((p) => p.slug === slug);
  if (fromLocal) {
    if (deletedIds.includes(fromLocal.id) || deletedIds.includes(fromLocal.slug)) {
      return null;
    }
    return fromLocal;
  }

  try {
    const item = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (item) {
      if (deletedIds.includes(item.id) || deletedIds.includes(item.slug)) {
        return null;
      }
      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        type: item.type as ProductType,
        category: item.category,
        condition: item.condition as any,
        damageDetails: item.damageDetails,
        priceCop: item.priceCop,
        stock: item.stock ?? 1,
        acceptsOffers: item.acceptsOffers,
        status: item.status as any,
        deliveryArea: item.deliveryArea,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        images: item.images.map((img) => ({
          id: img.id,
          productId: img.productId,
          storagePath: img.storagePath,
          sortOrder: img.sortOrder,
          altText: img.altText,
        })),
      };
    }
  } catch {
    // Continuar si falla PostgreSQL
  }

  return null;
}
