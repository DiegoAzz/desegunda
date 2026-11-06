import Link from 'next/link';
import BigCategoryButtons from '@/components/BigCategoryButtons';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface DigitalesPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function DigitalesPage({ searchParams }: DigitalesPageProps) {
  const query = searchParams.q || '';
  const products = await getProducts({ type: 'DIGITAL', query });

  return (
    <div className="space-y-6">
      {/* Botones de Categorías con DIGITALES activo */}
      <section aria-label="Categorías principales">
        <BigCategoryButtons activeType="DIGITAL" />
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
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">
          Servicios y Productos Digitales
        </span>
      </div>

      <SearchBar initialQuery={query} placeholder="Buscar servicios o productos digitales..." />

      <section aria-label="Listado de productos digitales" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>💻</span>
            <span>{query ? `Digitales: «${query}»` : 'Servicios y Productos Digitales'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
            {products.length} {products.length === 1 ? 'disponible' : 'disponibles'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <span className="text-4xl block">💻</span>
            <p className="text-lg font-bold text-slate-700">
              Todavía no tengo productos digitales publicados
            </p>
            <p className="text-sm text-slate-500">
              Pronto encontrarás diseño web, consultoría, plantillas y soluciones digitales disponibles.
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
