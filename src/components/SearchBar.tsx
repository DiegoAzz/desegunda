'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
}

export default function SearchBar({
  initialQuery = '',
  placeholder = '¿Qué buscas?',
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialQuery || searchParams.get('q') || '');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    } else {
      params.delete('q');
    }

    startTransition(() => {
      // Si estamos en la página de un producto individual o admin, redirigir a inicio
      const targetPath = pathname.startsWith('/p/') || pathname.startsWith('/admin') ? '/' : pathname;
      const queryString = params.toString();
      router.push(queryString ? `${targetPath}?${queryString}` : targetPath);
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <form onSubmit={handleSearch} className="w-full relative my-3" role="search">
      <div className="relative flex items-center">
        <span className="absolute left-4 text-xl select-none text-slate-400" aria-hidden="true">
          🔎
        </span>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar producto por nombre o categoría"
          className="w-full min-h-[52px] pl-12 pr-12 text-base bg-white border border-slate-300 rounded-full focus:border-[#3483FA] focus:outline-hidden focus:ring-4 focus:ring-blue-100 text-[#333333] placeholder-slate-400 font-medium transition shadow-xs"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 text-slate-400 hover:text-slate-700 p-2 font-bold text-lg"
            aria-label="Borrar búsqueda"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  );
}
