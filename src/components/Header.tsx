import Link from 'next/link';

interface HeaderProps {
  storeName?: string;
  tagline?: string;
}

export default function Header({
  storeName = 'LO TENGO',
  tagline = 'Cosas buenas para alguien más.',
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="group flex items-center space-x-2">
          <span className="text-3xl" role="img" aria-label="Reciclaje y valor">
            ♻️
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-green-700 transition">
              {storeName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">{tagline}</p>
          </div>
        </Link>

        <Link
          href="/admin"
          className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded transition"
          title="Acceso administrativo"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
