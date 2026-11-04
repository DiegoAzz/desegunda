import Link from 'next/link';
import BigCategoryButtons from '@/components/BigCategoryButtons';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface GratisPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function GratisPage({ searchParams }: GratisPageProps) {
  const query = searchParams.q || '';
  const products = await getProducts({ type: 'GIFT', query });

  return (
    <div className="space-y-6">
      {/* 3 Botones Gigantes con GRATIS activo */}
      <section aria-label="Categorías principales">
        <BigCategoryButtons activeType="GIFT" />
      </section>

      {/* Navegación y título de sección */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-300 transition"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
          Catálogo: 100 % Gratuitos
        </span>
      </div>

      {/* Banner de transparencia para regalos según PRD */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-950 space-y-1">
        <div className="flex items-center space-x-2 font-black text-base">
          <span>🎁</span>
          <span>Regalos y Donaciones — Sin Costo Alguno</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-900">
          Estos artículos se regalan sin ningún cobro. Si te interesa alguno, pulsa{' '}
          <strong>QUIERO ESTE REGALO</strong> para escribirme a WhatsApp y coordinar la entrega.
          No hay filas automáticas ni pagos por reserva.
        </p>
      </div>

      <SearchBar initialQuery={query} placeholder="Buscar en regalos..." />

      <section aria-label="Listado de regalos disponibles" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>🎁</span>
            <span>{query ? `Regalos: «${query}»` : 'Artículos Disponibles para Regalo'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
            {products.length} {products.length === 1 ? 'disponible' : 'disponibles'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <span className="text-4xl block">🎁</span>
            <p className="text-lg font-bold text-slate-700">
              Todavía no tengo regalos disponibles
            </p>
            <p className="text-sm text-slate-500">
              Pronto publicaré más artículos que ya no uso para regalar a quien los necesite.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
