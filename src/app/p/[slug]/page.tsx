import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug, getStoreSettings } from '@/lib/db';
import { formatCop, getShortCode } from '@/lib/format';
import WhatsAppButton from '@/components/WhatsAppButton';
import ShareButton from '@/components/ShareButton';
import WompiPayButton from '@/components/WompiPayButton';
import ProductGallery from '@/components/ProductGallery';

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

      {/* Contenedor Principal Estilo Mercado Libre (2 columnas en PC) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Galería Interactiva con Fotos y Video */}
        <ProductGallery
          images={product.images || []}
          title={product.title}
          type={product.type}
          condition={product.condition}
          status={product.status}
          videoUrl={product.videoUrl}
        />

        {/* Columna Derecha: Cabecera del Producto, Precio y Compra */}
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

          {/* ALERTA DE DAÑO TRANSPARENTE */}
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

          {/* Descripción */}
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
            {/* Si es producto digital y Wompi no está habilitado, explicar que se acuerda primero por WhatsApp */}
            {product.type === 'DIGITAL' && !product.allowWompiPayment && isAvailable && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-blue-950 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-blue-900 text-sm">
                  <span>💡</span>
                  <span>Cotización y acuerdo previo por WhatsApp</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Para este servicio digital, primero conversamos y acordamos el alcance y requerimientos exactos antes de generar el pago.
                </p>
              </div>
            )}

            {/* Botón de pago directo Wompi: solo si no es regalo, está disponible y permitido */}
            {!isGift && isAvailable && (product.type !== 'DIGITAL' ? (product.allowWompiPayment !== false) : Boolean(product.allowWompiPayment)) && (
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
              text={`Mira este artículo en ${settings.storeName}: ${product.title}`}
              className="w-full"
            />

            <p className="text-xs text-center text-slate-400 pt-2">
              {product.type === 'DIGITAL' && !product.allowWompiPayment
                ? 'Escríbeme a WhatsApp para cotizar y comenzar de inmediato con tu proyecto.'
                : 'Puedes pagar directamente por Wompi o escribirme a WhatsApp para coordinar la entrega.'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
