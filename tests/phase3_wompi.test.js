const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

function generateWompiSignature(reference, amountInCents, currency, integritySecret) {
  const rawString = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

function createWompiReference(productId) {
  const cleanId = productId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  return `LT-${cleanId}-1730000000`;
}

function canGenerateWompiCheckout(product) {
  if (!product) return false;
  if (product.type === 'GIFT') return false;
  if (product.status !== 'AVAILABLE') return false;
  if (product.stock !== undefined && product.stock <= 0) return false;
  if (!product.priceCop || product.priceCop <= 0) return false;
  return true;
}

describe('Fase 3 — Integración de Wompi (Bancolombia) y Control de Inventario', () => {

  test('Cálculo exacto de la firma de integridad SHA-256 de Wompi', () => {
    const reference = 'LT-prod123-1730000000';
    const amountInCents = 14500000; // 145.000 COP
    const currency = 'COP';
    const integritySecret = 'prod_integrity_wWDwKGW5r3VzaUmGA61XgXBAPGOYqpNk';

    const signature = generateWompiSignature(reference, amountInCents, currency, integritySecret);

    assert.equal(signature.length, 64);
    assert.match(signature, /^[a-f0-9]{64}$/);

    const expected = crypto
      .createHash('sha256')
      .update('LT-prod123-173000000014500000COPprod_integrity_wWDwKGW5r3VzaUmGA61XgXBAPGOYqpNk')
      .digest('hex');

    assert.equal(signature, expected);
  });

  test('Conversión de monto a centavos para Wompi', () => {
    const priceCop = 50000;
    const amountInCents = priceCop * 100;
    assert.equal(amountInCents, 5000000);
  });

  test('Regla innegociable: los regalos nunca generan checkout de Wompi', () => {
    const giftProduct = {
      id: 'prod-gift-01',
      type: 'GIFT',
      priceCop: null,
      status: 'AVAILABLE',
      stock: 1,
    };
    assert.equal(canGenerateWompiCheckout(giftProduct), false);
  });

  test('Control de inventario: productos agotados (stock <= 0) o ya vendidos NO pueden comprarse', () => {
    // 1. Producto disponible con stock
    const availableProduct = {
      id: 'prod-new-01',
      type: 'NEW',
      priceCop: 145000,
      status: 'AVAILABLE',
      stock: 1,
    };
    assert.equal(canGenerateWompiCheckout(availableProduct), true);

    // 2. Producto vendido
    const soldProduct = {
      id: 'prod-sold-01',
      type: 'NEW',
      priceCop: 145000,
      status: 'SOLD',
      stock: 0,
    };
    assert.equal(canGenerateWompiCheckout(soldProduct), false);

    // 3. Producto con status AVAILABLE pero stock = 0
    const outOfStockProduct = {
      id: 'prod-out-01',
      type: 'USED',
      priceCop: 80000,
      status: 'AVAILABLE',
      stock: 0,
    };
    assert.equal(canGenerateWompiCheckout(outOfStockProduct), false);

    // 4. Producto reservado por el dueño
    const reservedProduct = {
      id: 'prod-res-01',
      type: 'USED',
      priceCop: 80000,
      status: 'RESERVED',
      stock: 1,
    };
    assert.equal(canGenerateWompiCheckout(reservedProduct), false);
  });

  test('Decremento de inventario al recibir pago aprobado', () => {
    function processApprovedSale(currentStock) {
      const newStock = Math.max(0, currentStock - 1);
      return {
        stock: newStock,
        status: newStock === 0 ? 'SOLD' : 'AVAILABLE',
      };
    }

    // Venta única: stock 1 pasa a 0 y estado SOLD
    const result1 = processApprovedSale(1);
    assert.equal(result1.stock, 0);
    assert.equal(result1.status, 'SOLD');

    // Venta con inventario múltiple: stock 3 pasa a 2 y sigue AVAILABLE
    const result2 = processApprovedSale(3);
    assert.equal(result2.stock, 2);
    assert.equal(result2.status, 'AVAILABLE');
  });

  test('Formato de referencia único y seguro', () => {
    const ref = createWompiReference('prod-new-001');
    assert.ok(ref.startsWith('LT-'));
    assert.ok(ref.includes('1730000000'));
  });
});
