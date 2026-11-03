'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCop } from '@/lib/format';
import { ProductStatusBadge, ProductTypeBadge } from '@/components/ProductStatusBadge';

interface AdminProductListProps {
  initialProducts: any[];
}

export default function AdminProductList({ initialProducts }: AdminProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
        router.refresh();
      } else {
        alert('No se pudo actualizar el estado');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar «${title}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      } else {
        alert('No se pudo eliminar el artículo');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoadingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-4">
        <span className="text-4xl block">📦</span>
        <h3 className="text-lg font-bold text-slate-800">No tienes productos publicados todavía</h3>
        <p className="text-sm text-slate-500">
          Comienza publicando tu primer artículo nuevo, usado o regalo.
        </p>
        <Link
          href="/admin/nuevo"
          className="inline-flex min-h-[48px] px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-base shadow-sm transition"
        >
          + PUBLICAR AHORA
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((item) => {
        const isGift = item.type === 'GIFT';
        const isAvailable = item.status === 'AVAILABLE';
        const isReserved = item.status === 'RESERVED';
        const isSold = item.status === 'SOLD';
        const isGiven = item.status === 'GIVEN_AWAY';
        const isHidden = item.status === 'HIDDEN';
        const stockCount = item.stock ?? (isSold || isGiven ? 0 : 1);
        const mainImg = item.images?.[0]?.storagePath || '/placeholder.svg';
        const isLoading = loadingId === item.id;

        return (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${
              isHidden || isSold
                ? 'opacity-70 border-dashed border-slate-300'
                : 'border-slate-200'
            }`}
          >
            {/* Miniatura y Datos Básicos */}
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <Image
                  src={mainImg}
                  alt={item.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <ProductTypeBadge type={item.type} condition={item.condition} />
                  <ProductStatusBadge status={item.status} />
                  {/* Etiqueta de inventario en admin */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      stockCount > 0
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    Stock: {stockCount}
                  </span>
                  {isHidden && (
                    <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      OCULTO
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base truncate" title={item.title}>
                  {item.title}
                </h3>

                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {isGift ? (
                    <span className="text-amber-600">GRATIS</span>
                  ) : (
                    <span>{formatCop(item.priceCop)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones del Administrador */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <Link
                href={`/admin/editar/${item.id}`}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
              >
                EDITAR
              </Link>

              {/* Toggle Reservado */}
              {isAvailable && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(item.id, 'RESERVED')}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg transition"
                >
                  RESERVAR
                </button>
              )}
              {isReserved && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(item.id, 'AVAILABLE')}
                  className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-900 text-xs font-bold rounded-lg transition"
                >
                  DISPONIBLE
                </button>
              )}

              {/* Marcar Vendido o Entregado */}
              {!isGift && !isSold && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(item.id, 'SOLD')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition"
                >
                  MARCAR VENDIDO
                </button>
              )}
              {isGift && !isGiven && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(item.id, 'GIVEN_AWAY')}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition"
                >
                  MARCAR ENTREGADO
                </button>
              )}

              {/* Ocultar / Publicar */}
              {!isHidden ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(item.id, 'HIDDEN')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition"
                >
                  OCULTAR
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStatusChange(item.id, 'AVAILABLE')}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition"
                >
                  PUBLICAR
                </button>
              )}

              {/* Eliminar con confirmación */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDelete(item.id, item.title)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition"
              >
                ELIMINAR
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
