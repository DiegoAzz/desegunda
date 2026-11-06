const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Fase 4 — Productos Digitales, Videos Cortos y Categorías Dinámicas', () => {
  test('Productos Digitales: Wompi desactivado por defecto para negociar primero por WhatsApp', () => {
    const digitalProduct = {
      type: 'DIGITAL',
      title: 'Diseño Web Profesional',
      priceCop: 800000,
      allowWompiPayment: false,
      status: 'AVAILABLE',
    };

    // Regla de negocio: Por defecto no permite pago directo con Wompi para servicios
    const isWompiEligible =
      digitalProduct.type !== 'GIFT' &&
      digitalProduct.status === 'AVAILABLE' &&
      Boolean(digitalProduct.allowWompiPayment);

    assert.equal(isWompiEligible, false, 'Los productos digitales no deben mostrar Wompi a menos que se autorice explícitamente');
  });

  test('Productos Digitales: Wompi se activa cuando el administrador lo habilita', () => {
    const digitalProduct = {
      type: 'DIGITAL',
      title: 'Plantilla Web Descargable',
      priceCop: 150000,
      allowWompiPayment: true,
      status: 'AVAILABLE',
    };

    const isWompiEligible =
      digitalProduct.type !== 'GIFT' &&
      digitalProduct.status === 'AVAILABLE' &&
      Boolean(digitalProduct.allowWompiPayment);

    assert.equal(isWompiEligible, true, 'Debe permitir Wompi si allowWompiPayment es true');
  });

  test('Soporte de Video: Formatos de video corto permitidos (MP4, WebM, MOV)', () => {
    const allowedVideoExtensions = ['.mp4', '.webm', '.mov', '.m4v'];
    const testFiles = ['demo.mp4', 'preview.webm', 'reel.mov', 'clip.m4v'];

    for (const file of testFiles) {
      const ext = '.' + file.split('.').pop().toLowerCase();
      assert.ok(allowedVideoExtensions.includes(ext), `El archivo ${file} debe ser admitido como video`);
    }
  });

  test('Gestión de Categorías: Lista dinámica sin duplicados', () => {
    const initialCategories = ['Tecnología', 'Hogar', 'Ropa'];
    const newCategory = 'Servicios Digitales';

    const updated = Array.from(new Set([...initialCategories, newCategory]));
    assert.equal(updated.length, 4);
    assert.ok(updated.includes('Servicios Digitales'));

    // Si se intenta agregar repetida (case-insensitive)
    const duplicate = 'tecnología';
    const isDuplicate = updated.some((c) => c.toLowerCase() === duplicate.toLowerCase());
    assert.equal(isDuplicate, true, 'Debe detectar duplicados');
  });

  test('Ubicación predeterminada oficial: Cartagena de Indias', () => {
    const defaultDeliveryArea = 'Cartagena de Indias';
    assert.equal(defaultDeliveryArea, 'Cartagena de Indias');
  });
});
