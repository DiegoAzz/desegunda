'use client';

import { useState } from 'react';
import { ProductItem } from '@/lib/types';

interface WompiPayButtonProps {
  product: ProductItem;
  className?: string;
}

export default function WompiPayButton({ product, className = '' }: WompiPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Regla estricta: los regalos NUNCA muestran botón de pago y ventas sin stock o no disponibles tampoco
  if (
    product.type === 'GIFT' ||
    product.status !== 'AVAILABLE' ||
    (product.stock !== undefined && product.stock <= 0)
  ) {
    return null;
  }

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/wompi/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.checkoutUrl) {
        // Redirigir a la pasarela oficial de Wompi
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'No se pudo generar la pasarela de pago');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión con el servicio de pagos');
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handlePay}
        className="w-full min-h-[56px] px-6 py-4 rounded-2xl bg-[#001E62] hover:bg-[#001545] text-white font-black text-lg flex flex-col items-center justify-center shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">💳</span>
          <span>{loading ? 'CONECTANDO CON WOMPI...' : 'PAGAR CON WOMPI'}</span>
        </div>
        <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider mt-0.5">
          PSE • Nequi • Bancolombia • Tarjetas
        </span>
      </button>

      <p className="text-[11px] text-center text-slate-400">
        Pago seguro procesado por Wompi Bancolombia
      </p>
    </div>
  );
}
