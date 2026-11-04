import Link from 'next/link';
import BigCategoryButtons from '@/components/BigCategoryButtons';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UsadosPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function UsadosPage({ searchParams }: UsadosPageProps) {
  const query = searchParams.q || '';
  const products = await getProducts({ type: 'USED', query });

  return (
    <div className="space-y-6">
      {/* 3 Botones Gigantes con USADOS activo */}
      <section aria-label="Categorías principales">
        <BigCategoryButtons activeType="USED" />
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
        <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
          Catálogo: Segunda Mano
        </span>
      </div>

      <SearchBar initialQuery={query} placeholder="Buscar en artículos de segunda mano..." />

      <section aria-label="Listado de artículos usados" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>♻️</span>
            <span>{query ? `Usados: «${query}»` : 'Artículos de Segunda Mano'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
            {products.length} {products.length === 1 ? 'disponible' : 'disponibles'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <span className="text-4xl block">♻️</span>
            <p className="text-lg font-bold text-slate-700">
              Todavía no tengo productos aquí
            </p>
            <p className="text-sm text-slate-500">
              No hay artículos usados listados en este momento.
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
