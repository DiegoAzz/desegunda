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

  return (
    <article className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Contenedor de Imagen Grande */}
      <Link href={`/p/${product.slug}`} className="relative aspect-[4/3] w-full bg-slate-100 block group overflow-hidden">
        <SafeImage
          src={mainImage}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges superiores flotantes */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <ProductTypeBadge type={product.type} condition={product.condition} />
        </div>

        <div className="absolute top-3 right-3 z-10">
          <ProductStatusBadge status={product.status} />
        </div>

        {/* Overlay si no está disponible */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white text-slate-900 font-black px-4 py-2 rounded-xl text-sm shadow-lg tracking-wider uppercase">
              {product.status === 'RESERVED' && '⏳ RESERVADO'}
              {product.status === 'SOLD' && '✓ VENDIDO'}
              {product.status === 'GIVEN_AWAY' && '🎁 ENTREGADO'}
            </span>
          </div>
        )}
      </Link>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>{product.category}</span>
            {product.deliveryArea && (
              <span className="truncate max-w-[140px]" title={product.deliveryArea}>
                📍 {product.deliveryArea.split('(')[0].trim()}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
            <Link href={`/p/${product.slug}`} className="hover:text-green-700 transition">
              {product.title}
            </Link>
          </h3>

          {/* Aviso especial si está dañado */}
          {product.condition === 'DAMAGED' && (
            <p className="mt-1 text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded-md border border-rose-200 line-clamp-1">
              ⚠️ Con falla: {product.damageDetails || 'Ver detalle de la falla'}
            </p>
          )}
        </div>

        <div>
          {/* Precio grande o GRATIS */}
          <div className="py-1">
            {isGift ? (
              <span className="text-2xl font-black text-amber-600 tracking-tight">
                GRATIS
              </span>
            ) : (
              <span className="text-2xl font-black text-slate-950 tracking-tight">
                {formatCop(product.priceCop)}
              </span>
            )}
            {product.acceptsOffers && !isGift && (
              <span className="ml-2 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 inline-block">
                Acepto ofertas
              </span>
            )}
          </div>

          {/* Botón VER PRODUCTO (Texto exacto del PRD estilo Mercado Libre) */}
          <Link
            href={`/p/${product.slug}`}
            className="w-full min-h-[48px] mt-2 bg-[#3483FA] hover:bg-[#2968C8] text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors active:scale-[0.99] text-base shadow-xs"
          >
            <span>VER PRODUCTO</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
