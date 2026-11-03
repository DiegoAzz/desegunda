import { formatCop, getShortCode } from './format';
import { ProductItem } from './types';

/**
 * Normaliza un número telefónico al formato internacional requerido para wa.me
 * Ejemplo: "+57 313 775 1715" -> "573137751715"
 * "3137751715" -> "573137751715"
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) {
    return '573137751715';
  }
  // If user entered 10 digits starting with 3 (Colombia mobile), prefix with 57
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }
  return digits;
}

export type WhatsAppAction = 'interest' | 'offer' | 'gift';

export interface BuildWhatsAppUrlParams {
  product: ProductItem;
  action?: WhatsAppAction;
  phoneNumber?: string;
  baseUrl?: string;
}

/**
 * Construye el enlace de WhatsApp según la plantilla oficial del PRD
 */
export function buildWhatsAppUrl({
  product,
  action = 'interest',
  phoneNumber = '573137751715',
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lotengo.com',
}: BuildWhatsAppUrlParams): string {
  const normalizedPhone = normalizeWhatsAppNumber(phoneNumber);
  const codigo = getShortCode(product.slug || product.id);
  const cleanBase = baseUrl.replace(/\/$/, '');
  const productUrl = `${cleanBase}/p/${product.slug}`;

  let message = '';

  if (product.type === 'GIFT' || action === 'gift') {
    // Regalo: Hola, vi el regalo «{nombre}» (código {codigo}) en LO TENGO. ¿Todavía está disponible? {url}
    message = `Hola, vi el regalo «${product.title}» (código ${codigo}) en LO TENGO. ¿Todavía está disponible? ${productUrl}`;
  } else if (action === 'offer') {
    // Oferta: Hola, vi «{nombre}» (código {codigo}) en LO TENGO. Quiero hacer una oferta. {url}
    message = `Hola, vi «${product.title}» (código ${codigo}) en LO TENGO. Quiero hacer una oferta. ${productUrl}`;
  } else {
    // Venta normal: Hola, vi en LO TENGO el producto «{nombre}» (código {codigo}) por {precio}. ¿Sigue disponible? {url}
    const precio = formatCop(product.priceCop);
    message = `Hola, vi en LO TENGO el producto «${product.title}» (código ${codigo}) por ${precio}. ¿Sigue disponible? ${productUrl}`;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
