import BigCategoryButtons from '@/components/BigCategoryButtons';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: {
    q?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = searchParams.q || '';
  const products = await getProducts({ query });

  return (
    <div className="space-y-6">
      {/* 3 Botones Gigantes: Prioridad Absoluta 1 del PRD */}
      <section aria-label="Categorías principales">
        <BigCategoryButtons />
      </section>

      {/* Buscador: 🔎 ¿Qué buscas? */}
      <section aria-label="Buscador rápido">
        <SearchBar initialQuery={query} />
      </section>

      {/* Sección principal: Lo que tengo disponible */}
      <section aria-label="Artículos disponibles" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>📦</span>
            <span>{query ? `Resultados para «${query}»` : 'Publicaciones'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
            {products.length} {products.length === 1 ? 'artículo' : 'artículos'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <span className="text-4xl block" role="img" aria-label="Caja vacía">
              📦
            </span>
            <p className="text-lg font-bold text-slate-700">
              Todavía no tengo productos aquí
            </p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              {query
                ? 'No encontré ningún artículo que coincida con tu búsqueda. Intenta con otra palabra.'
                : 'Vuelve a revisar pronto o pregúntame por WhatsApp si buscas algo en particular.'}
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
