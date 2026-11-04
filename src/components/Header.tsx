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
    <header className="bg-[#FFE600] border-b border-[#ebd300] sticky top-0 z-30 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="group flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <span className="text-2xl" role="img" aria-label="Reciclaje y valor">
              ♻️
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#2D3277] group-hover:text-blue-900 transition leading-none">
              {storeName}
            </h1>
            <p className="text-[11px] text-[#2D3277]/80 font-bold mt-0.5">{tagline}</p>
          </div>
        </Link>

        <Link
          href="/admin"
          className="text-xs font-bold text-[#2D3277] bg-black/5 hover:bg-black/10 px-3 py-1.5 rounded-full transition border border-[#2D3277]/10"
          title="Acceso administrativo"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
