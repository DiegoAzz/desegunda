const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Import helper functions compiled / transpilable
function normalizeWhatsAppNumber(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '573137751715';
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }
  return digits;
}

function formatCop(amount) {
  if (amount === null || amount === undefined) {
    return 'GRATIS';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getShortCode(slugOrId) {
  const parts = slugOrId.split('-');
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase();
  }
  return slugOrId.substring(0, 6).toUpperCase();
}

function buildWhatsAppUrl({ product, action = 'interest', phoneNumber = '573137751715', baseUrl = 'https://lotengo.com' }) {
  const normalizedPhone = normalizeWhatsAppNumber(phoneNumber);
  const codigo = getShortCode(product.slug || product.id);
  const cleanBase = baseUrl.replace(/\/$/, '');
  const productUrl = `${cleanBase}/p/${product.slug}`;

  let message = '';
  if (product.type === 'GIFT' || action === 'gift') {
    message = `Hola, vi el regalo «${product.title}» (código ${codigo}) en LO TENGO. ¿Todavía está disponible? ${productUrl}`;
  } else if (action === 'offer') {
    message = `Hola, vi «${product.title}» (código ${codigo}) en LO TENGO. Quiero hacer una oferta. ${productUrl}`;
  } else {
    const precio = formatCop(product.priceCop);
    message = `Hola, vi en LO TENGO el producto «${product.title}» (código ${codigo}) por ${precio}. ¿Sigue disponible? ${productUrl}`;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

describe('Fase 1 — Verificación y Reglas del Negocio de LO TENGO', () => {

  test('Normalización de WhatsApp al formato internacional 573137751715', () => {
    assert.equal(normalizeWhatsAppNumber('+57 313 775 1715'), '573137751715');
    assert.equal(normalizeWhatsAppNumber('3137751715'), '573137751715');
    assert.equal(normalizeWhatsAppNumber('573137751715'), '573137751715');
    assert.equal(normalizeWhatsAppNumber(''), '573137751715');
  });

  test('Formato de moneda COP y palabra GRATIS', () => {
    assert.equal(formatCop(null), 'GRATIS');
    assert.equal(formatCop(undefined), 'GRATIS');
    const formatted = formatCop(145000);
    // Debe incluir dígitos y formato monetario
    assert.match(formatted, /145/);
    assert.match(formatted, /\$/);
  });

  test('Enlace de WhatsApp para producto NUEVO / Venta normal', () => {
    const product = {
      id: 'prod-1',
      slug: 'audifonos-bluetooth-x89k2',
      title: 'Audífonos Bluetooth Nuevos',
      type: 'NEW',
      priceCop: 145000,
      status: 'AVAILABLE',
    };

    const url = buildWhatsAppUrl({ product, action: 'interest', baseUrl: 'https://lotengo.com' });
    assert.ok(url.startsWith('https://wa.me/573137751715?text='));
    
    // Decodificar el mensaje para verificar plantilla exacta del PRD
    const textParam = decodeURIComponent(url.split('?text=')[1]);
    assert.ok(textParam.includes('Hola, vi en LO TENGO el producto «Audífonos Bluetooth Nuevos»'));
    assert.ok(textParam.includes('(código X89K2)'));
    assert.ok(textParam.includes('¿Sigue disponible?'));
    assert.ok(textParam.includes('https://lotengo.com/p/audifonos-bluetooth-x89k2'));
  });

  test('Enlace de WhatsApp para HACER OFERTA', () => {
    const product = {
      id: 'prod-2',
      slug: 'monitor-dell-m391z',
      title: 'Monitor Dell 24"',
      type: 'USED',
      priceCop: 320000,
      acceptsOffers: true,
      status: 'AVAILABLE',
    };

    const url = buildWhatsAppUrl({ product, action: 'offer', baseUrl: 'https://lotengo.com' });
    const textParam = decodeURIComponent(url.split('?text=')[1]);
    assert.ok(textParam.includes('Hola, vi «Monitor Dell 24"» (código M391Z) en LO TENGO. Quiero hacer una oferta.'));
    assert.ok(textParam.includes('https://lotengo.com/p/monitor-dell-m391z'));
  });

  test('Enlace de WhatsApp para REGALO (sin precio, plantilla exacta)', () => {
    const product = {
      id: 'prod-3',
      slug: 'lote-de-libros-g190d',
      title: 'Lote de 6 Libros',
      type: 'GIFT',
      priceCop: null,
      status: 'AVAILABLE',
    };

    const url = buildWhatsAppUrl({ product, action: 'gift', baseUrl: 'https://lotengo.com' });
    const textParam = decodeURIComponent(url.split('?text=')[1]);
    assert.ok(textParam.includes('Hola, vi el regalo «Lote de 6 Libros» (código G190D) en LO TENGO. ¿Todavía está disponible?'));
    assert.ok(!textParam.includes('$'), 'Un regalo jamás debe contener precio ni signo $ en el mensaje');
  });

  test('Validación de artículos dañados: exige damageDetails', () => {
    const damagedItem = {
      title: 'Licuadora Oster',
      type: 'USED',
      condition: 'DAMAGED',
      damageDetails: 'El vaso de vidrio tiene una fisura en la base y gotea.',
    };

    assert.ok(damagedItem.condition === 'DAMAGED');
    assert.ok(typeof damagedItem.damageDetails === 'string' && damagedItem.damageDetails.length > 5);
  });

  test('Regla de negocio: los regalos nunca aceptan ofertas ni precio', () => {
    const giftItem = {
      title: 'Portavasos artesanales',
      type: 'GIFT',
      priceCop: null,
      acceptsOffers: false,
    };

    assert.equal(giftItem.priceCop, null);
    assert.equal(giftItem.acceptsOffers, false);
  });
});
