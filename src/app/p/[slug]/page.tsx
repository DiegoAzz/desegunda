import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug, getStoreSettings } from '@/lib/db';
import { formatCop, getShortCode } from '@/lib/format';
import { ProductStatusBadge, ProductTypeBadge } from '@/components/ProductStatusBadge';
import WhatsAppButton from '@/components/WhatsAppButton';
import ShareButton from '@/components/ShareButton';
import WompiPayButton from '@/components/WompiPayButton';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    wompi_ref?: string;
    id?: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return {
      title: 'Artículo no encontrado — LO TENGO',
    };
  }

  const priceLabel = product.type === 'GIFT' ? 'GRATIS' : formatCop(product.priceCop);
  return {
    title: `${product.title} (${priceLabel}) — LO TENGO`,
    description: product.description.substring(0, 150),
    openGraph: {
      title: `${product.title} — LO TENGO`,
      description: `${priceLabel} | ${product.category}. ${product.description.substring(0, 120)}`,
      images: product.images?.[0]?.storagePath ? [product.images[0].storagePath] : [],
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [product, settings] = await Promise.all([
    getProductBySlug(params.slug),
    getStoreSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const isGift = product.type === 'GIFT';
  const isAvailable = product.status === 'AVAILABLE';
  const shortCode = getShortCode(product.slug || product.id);
  const deliveryLocation = product.deliveryArea || settings.defaultDeliveryArea;
  const isReturningFromWompi = Boolean(searchParams?.wompi_ref || searchParams?.id);

  return (
    <article className="space-y-6 pb-8">
      {/* Botón superior Volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-700 hover:text-slate-950 bg-white px-3 py-2 rounded-xl border border-slate-300 transition active:scale-[0.98]"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">
          CÓDIGO: {shortCode}
        </span>
      </div>

      {/* Banner de retorno de Wompi */}
      {isReturningFromWompi && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-emerald-950 space-y-1 shadow-sm">
          <div className="flex items-center space-x-2 font-black text-base text-emerald-800">
            <span>🎉</span>
            <span>¡Transacción de Wompi Registrada!</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900">
            Tu solicitud de pago ha sido procesada por Wompi Bancolombia. Escríbeme a WhatsApp para coordinar la entrega inmediata de tu artículo.
          </p>
        </div>
      )}

      {/* Galería / Fotos grandes */}
      <div className="space-y-3">
        <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
          <Image
            src={product.images?.[0]?.storagePath || '/placeholder.svg'}
            alt={product.images?.[0]?.altText || product.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
            priority
          />

          {/* Badges superiores */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            <ProductTypeBadge type={product.type} condition={product.condition} />
          </div>
          <div className="absolute top-4 right-4 z-10">
            <ProductStatusBadge status={product.status} />
          </div>

          {/* Overlay si no está disponible */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-4 text-center shadow-2xl max-w-xs">
                <span className="text-3xl block mb-1">
                  {product.status === 'RESERVED' && '⏳'}
                  {product.status === 'SOLD' && '✓'}
                  {product.status === 'GIVEN_AWAY' && '🎁'}
                </span>
                <p className="text-lg font-black text-slate-900 uppercase">
                  {product.status === 'RESERVED' && 'Artículo Reservado'}
                  {product.status === 'SOLD' && 'Artículo Vendido'}
                  {product.status === 'GIVEN_AWAY' && 'Regalo Entregado'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Este artículo ya no está disponible para contactar ni comprar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Miniaturas si hay más fotos */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
              >
                <Image
                  src={img.storagePath}
                  alt={img.altText || `${product.title} foto ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cabecera del Producto: Título y Precio */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>{product.category}</span>
            <span>Ref: {shortCode}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {product.title}
          </h1>
        </div>

        {/* Precio o GRATIS */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-baseline gap-3">
          {isGift ? (
            <div className="space-y-0.5">
              <span className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
                GRATIS
              </span>
              <p className="text-xs font-bold text-amber-800">
                100 % libre de costo • Sin cobros ocultos
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {formatCop(product.priceCop)}
              </span>
              {product.acceptsOffers && (
                <span className="ml-2 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 inline-block">
                  ✓ Acepto ofertas razonables
                </span>
              )}
            </div>
          )}
        </div>

        {/* ALERTA DE DAÑO TRANSPARENTE: Requisito Crítico 4 y 5 del PRD */}
        {product.condition === 'DAMAGED' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-950 space-y-2">
            <div className="flex items-center space-x-2 font-black text-base text-rose-800">
              <span className="text-xl">⚠️</span>
              <span>ESTADO: ARTÍCULO CON DETALLE / DAÑADO</span>
            </div>
            <p className="text-sm font-medium text-rose-900 leading-relaxed">
              <strong>Falla indicada con total claridad:</strong> {product.damageDetails}
            </p>
            <p className="text-xs text-rose-700 italic">
              Por favor revisa cuidadosamente esta descripción antes de escribir por WhatsApp o pagar.
            </p>
          </div>
        )}

        {/* Zona de entrega */}
        <div className="flex items-start space-x-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-base select-none">📍</span>
          <div>
            <span className="font-bold text-slate-800">Ubicación / Entrega: </span>
            <span>{deliveryLocation}</span>
          </div>
        </div>

        {/* Descripción breve */}
        <div className="space-y-2 pt-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Descripción
          </h2>
          <p className="text-base text-slate-700 whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* ACCIONES PRINCIPALES: WHATSAPP Y WOMPI */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          {/* Si es artículo en venta y está disponible, mostrar botón directo de Wompi */}
          {!isGift && isAvailable && (
            <div className="pb-2 border-b border-slate-100">
              <WompiPayButton product={product} />
            </div>
          )}

          {/* Botón principal de WhatsApp */}
          <WhatsAppButton
            product={product}
            action={isGift ? 'gift' : 'interest'}
            whatsappNumber={settings.whatsappNumber}
          />

          {/* Botón opcional «HACER OFERTA» si acepta ofertas y no es regalo */}
          {product.acceptsOffers && !isGift && isAvailable && (
            <WhatsAppButton
              product={product}
              action="offer"
              whatsappNumber={settings.whatsappNumber}
            />
          )}

          {/* Botón secundario «COMPARTIR» */}
          <ShareButton
            title={product.title}
            text={`Mira este artículo en LO TENGO: ${product.title}`}
            className="w-full"
          />

          <p className="text-xs text-center text-slate-400 pt-2">
            Puedes pagar directamente por Wompi o escribirme a WhatsApp para coordinar la entrega.
          </p>
        </div>
      </div>
    </article>
  );
}
