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

  // Regla estricta: los regalos NUNCA muestran botón de pago y ventas sin stock tampoco
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
        body: JSON.stringify({
          productId: product.id,
          slug: product.slug,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'No se pudo generar la pasarela de pago');
        setLoading(false);
        return;
      }

      // Redirigir directamente al Web Checkout oficial de Wompi Bancolombia
      // Esto elimina al 100% los fallos de iframe bloqueado o 'no se pudo cargar la información del widget'
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback mediante formulario oficial de Wompi
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = 'https://checkout.wompi.co/p/';

        const fields: Record<string, string> = {
          'public-key': data.publicKey,
          currency: 'COP',
          'amount-in-cents': data.amountInCents.toString(),
          reference: data.reference,
          'signature:integrity': data.signature,
          'redirect-url': data.redirectUrl,
        };

        for (const [key, value] of Object.entries(fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      }
    } catch {
      setError('Error de conexión con el servicio de pagos');
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-[#001E62] hover:bg-[#00174c] text-white font-black py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center space-y-1 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
      >
        <div className="flex items-center space-x-2 text-base sm:text-lg">
          <span>💳</span>
          <span>{loading ? 'Redirigiendo a Wompi Bancolombia...' : 'PAGAR CON WOMPI'}</span>
        </div>
        <span className="text-[11px] text-blue-200 font-medium tracking-wide">
          PSE • NEQUI • BANCOLOMBIA • TARJETAS
        </span>
      </button>
      <p className="text-[11px] text-center text-slate-400">
        Pago seguro en línea procesado por Wompi Bancolombia
      </p>
    </div>
  );
}
