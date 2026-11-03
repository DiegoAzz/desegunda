'use client';

import { useState, useEffect } from 'react';
import { ProductItem } from '@/lib/types';

interface WompiPayButtonProps {
  product: ProductItem;
  className?: string;
}

export default function WompiPayButton({ product, className = '' }: WompiPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar el script oficial de Wompi Widget en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).WidgetCheckout) {
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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

      // Si el widget oficial de Wompi está cargado, abrir el modal nativo
      if (typeof window !== 'undefined' && (window as any).WidgetCheckout) {
        const checkout = new (window as any).WidgetCheckout({
          currency: 'COP',
          amountInCents: data.amountInCents,
          reference: data.reference,
          publicKey: data.publicKey,
          signature: {
            integrity: data.signature,
          },
          redirectUrl: data.redirectUrl,
        });

        checkout.open((result: any) => {
          const transaction = result?.transaction;
          if (transaction?.status === 'APPROVED') {
            window.location.href = `${data.redirectUrl}&wompi_status=APPROVED`;
          }
          setLoading(false);
        });
      } else {
        // Fallback: Redirección mediante formulario estándar de Wompi Web Checkout
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
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-bold flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
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
          <span>{loading ? 'ABRIENDO PASARELA WOMPI...' : 'PAGAR CON WOMPI'}</span>
        </div>
        <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider mt-0.5">
          PSE • Nequi • Bancolombia • Tarjetas
        </span>
      </button>

      <p className="text-[11px] text-center text-slate-400">
        Pago seguro en línea procesado por Wompi Bancolombia
      </p>
    </div>
  );
}
