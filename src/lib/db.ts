import { PrismaClient } from '@prisma/client';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from './initial-data';
import { ProductItem, ProductType, StoreSettingsItem } from './types';
import fs from 'fs';
import path from 'path';

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

function loadLocalCustomProducts(): ProductItem[] {
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, 'custom_products.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {
    // Si no existe o hay error, continuar sin problemas
  }
  return [];
}

/**
 * Obtiene los ajustes de la tienda
 */
export async function getStoreSettings(): Promise<StoreSettingsItem> {
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
    // Usar datos iniciales si la BD no está disponible
  }
  return INITIAL_STORE_SETTINGS;
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
    } else {
      whereClause.status = {
        not: 'HIDDEN',
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

  // Unir productos locales creados por el admin con el catálogo base
  let list = [...localCustom, ...dbProducts];

  // Si no hay ninguno de los dos, usar productos semilla
  if (list.length === 0) {
    list = [...INITIAL_PRODUCTS];
  } else {
    // Añadir productos semilla que no estén duplicados por slug
    for (const p of INITIAL_PRODUCTS) {
      if (!list.some((item) => item.slug === p.slug)) {
        list.push(p);
      }
    }
  }

  if (!includeUnavailable) {
    list = list.filter((p) => p.status === 'AVAILABLE' || p.status === 'RESERVED');
  } else {
    list = list.filter((p) => p.status !== 'HIDDEN');
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
  const localCustom = loadLocalCustomProducts();
  const fromLocal = localCustom.find((p) => p.slug === slug);
  if (fromLocal && fromLocal.status !== 'HIDDEN') {
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

    if (item && item.status !== 'HIDDEN') {
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
    // Fallback si no hay conexión
  }

  const found = INITIAL_PRODUCTS.find((p) => p.slug === slug && p.status !== 'HIDDEN');
  return found || null;
}
