import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProducts, getStoreSettings } from '@/lib/db';
import AdminProductList from './AdminProductList';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  // Cargar productos y ajustes usando el canal unificado
  const [products, settings] = await Promise.all([
    getProducts({ includeUnavailable: true }),
    getStoreSettings(),
  ]);

  // Contadores según PRD: Disponibles, Reservados, Vendidos, Entregados
  const countAvailable = products.filter((p) => p.status === 'AVAILABLE').length;
  const countReserved = products.filter((p) => p.status === 'RESERVED').length;
  const countSold = products.filter((p) => p.status === 'SOLD').length;
  const countGiven = products.filter((p) => p.status === 'GIVEN_AWAY').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Barra superior de administración */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Mis Productos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Administración de publicaciones de {settings.storeName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/nuevo"
            className="min-h-[48px] px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-base flex items-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            <span>+</span>
            <span>PUBLICAR</span>
          </Link>

          <Link
            href="/admin/ajustes"
            className="min-h-[48px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center transition"
          >
            Ajustes
          </Link>

          <Link
            href="/"
            className="min-h-[48px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center transition"
          >
            Ver Tienda
          </Link>
        </div>
      </div>

      {/* Contadores básicos del PRD: Disponibles, Reservados, Vendidos, Entregados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-2xl sm:text-3xl font-black text-green-700 block">
            {countAvailable}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Disponibles
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 block">
            {countReserved}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Reservados
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-2xl sm:text-3xl font-black text-slate-700 block">
            {countSold}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Vendidos
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-2xl sm:text-3xl font-black text-purple-700 block">
            {countGiven}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Entregados
          </span>
        </div>
      </div>

      {/* Lista interactiva de productos */}
      <AdminProductList initialProducts={products} />
    </div>
  );
}
