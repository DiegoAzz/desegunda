import Link from 'next/link';
import SafeImage from './SafeImage';
import { ProductItem } from '@/lib/types';
import { formatCop } from '@/lib/format';
import { ProductStatusBadge, ProductTypeBadge } from './ProductStatusBadge';

interface ProductCardProps {
  product: ProductItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0]?.storagePath || '/placeholder.svg';
  const isAvailable = product.status === 'AVAILABLE' && (product.stock === undefined || product.stock > 0);
  const isGift = product.type === 'GIFT';
  const isSold = product.status === 'SOLD' || (!isGift && product.stock !== undefined && product.stock <= 0);
  const isReserved = product.status === 'RESERVED';
  const isGiven = product.status === 'GIVEN_AWAY';

  return (
    <article className="bg-white rounded-lg border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group h-full">
      {/* Contenedor de Imagen Estilo Mercado Libre */}
      <Link href={`/p/${product.slug}`} className="relative aspect-square w-full bg-white flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden block">
        <SafeImage
          src={mainImage}
          alt={product.title}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges superiores flotantes */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
          <ProductTypeBadge type={product.type} condition={product.condition} />
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          <ProductStatusBadge status={product.status} />
        </div>

        {/* Overlay si no está disponible */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-2 z-10">
            <span className="bg-white text-slate-900 font-black px-3 py-1.5 rounded-lg text-xs shadow-md tracking-wider uppercase">
              {isReserved && '⏳ RESERVADO'}
              {isSold && '✓ VENDIDO'}
              {isGiven && '🎁 ENTREGADO'}
            </span>
          </div>
        )}
      </Link>

      {/* Contenido */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>{product.category}</span>
            {product.deliveryArea && (
              <span className="truncate max-w-[120px]" title={product.deliveryArea}>
                📍 {product.deliveryArea.split('(')[0].trim()}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-normal text-slate-800 line-clamp-2 leading-snug group-hover:text-[#3483FA] transition-colors">
            <Link href={`/p/${product.slug}`}>
              {product.title}
            </Link>
          </h3>

          {/* Aviso especial si está dañado */}
          {product.condition === 'DAMAGED' && (
            <p className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 line-clamp-1">
              ⚠️ Con detalle: {product.damageDetails || 'Ver detalle'}
            </p>
          )}
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          {/* Precio estilo Mercado Libre o GRATIS */}
          <div>
            {isGift ? (
              <span className="text-2xl font-black text-amber-600 tracking-tight">
                GRATIS
              </span>
            ) : (
              <div className="flex items-baseline space-x-1">
                <span className="text-sm font-normal text-slate-800">$</span>
                <span className="text-2xl font-normal text-slate-900 tracking-tight">
                  {formatCop(product.priceCop).replace('$', '').trim()}
                </span>
              </div>
            )}

            {/* Línea verde estilo Mercado Libre */}
            {product.acceptsOffers && !isGift ? (
              <p className="text-xs font-semibold text-[#00A650] mt-0.5">
                ✓ Acepto ofertas razonables
              </p>
            ) : (
              <p className="text-xs font-semibold text-[#00A650] mt-0.5">
                ✓ Entrega inmediata
              </p>
            )}
          </div>

          {/* Botón VER PRODUCTO Estilo Mercado Libre */}
          <Link
            href={`/p/${product.slug}`}
            className="w-full py-2.5 px-3 bg-[#3483FA] hover:bg-[#2968C8] text-white rounded-md font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-colors shadow-xs active:scale-[0.99]"
          >
            <span>VER PRODUCTO</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
