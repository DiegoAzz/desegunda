const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Fase 2 — Panel de Administración y Validaciones de Seguridad', () => {

  test('Validación de subida de imágenes: tipos y tamaños permitidos', () => {
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    assert.ok(ALLOWED_MIME_TYPES.includes('image/jpeg'));
    assert.ok(ALLOWED_MIME_TYPES.includes('image/webp'));
    assert.ok(ALLOWED_MIME_TYPES.includes('image/png'));
    assert.ok(!ALLOWED_MIME_TYPES.includes('application/pdf'));
    assert.ok(!ALLOWED_MIME_TYPES.includes('image/gif'));

    const smallFile = 2 * 1024 * 1024;
    const largeFile = 6 * 1024 * 1024;

    assert.ok(smallFile <= MAX_FILE_SIZE);
    assert.ok(largeFile > MAX_FILE_SIZE);
  });

  test('Regla de publicación: título obligatorio de máximo 90 caracteres', () => {
    function validateTitle(title) {
      if (!title || title.trim().length === 0) return false;
      if (title.length > 90) return false;
      return true;
    }

    assert.equal(validateTitle(''), false);
    assert.equal(validateTitle('   '), false);
    assert.equal(validateTitle('Bicicleta de montaña rin 29'), true);
    assert.equal(validateTitle('a'.repeat(91)), false);
    assert.equal(validateTitle('a'.repeat(90)), true);
  });

  test('Regla de precio: ventas exigen precio > 0, regalos siempre null', () => {
    function processPrice(type, rawPrice) {
      if (type === 'GIFT') return { valid: true, priceCop: null };
      const parsed = parseInt(rawPrice, 10);
      if (isNaN(parsed) || parsed <= 0) return { valid: false, priceCop: null };
      return { valid: true, priceCop: parsed };
    }

    assert.deepEqual(processPrice('GIFT', 50000), { valid: true, priceCop: null });
    assert.deepEqual(processPrice('GIFT', null), { valid: true, priceCop: null });
    assert.equal(processPrice('NEW', 0).valid, false);
    assert.equal(processPrice('USED', -100).valid, false);
    assert.equal(processPrice('USED', 'abc').valid, false);
    assert.deepEqual(processPrice('NEW', '150000'), { valid: true, priceCop: 150000 });
  });

  test('Regla de fallas en usados: si está dañado exige damageDetails', () => {
    function validateCondition(type, condition, details) {
      if (type !== 'USED') return true;
      if (!['GOOD', 'DETAILS', 'DAMAGED'].includes(condition)) return false;
      if (condition === 'DAMAGED' && (!details || details.trim().length < 5)) return false;
      return true;
    }

    assert.equal(validateCondition('USED', 'GOOD', null), true);
    assert.equal(validateCondition('USED', 'DAMAGED', ''), false);
    assert.equal(validateCondition('USED', 'DAMAGED', 'ok'), false);
    assert.equal(validateCondition('USED', 'DAMAGED', 'El botón de encendido está roto pero funciona con control'), true);
  });
});
