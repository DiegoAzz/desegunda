import Link from 'next/link';

interface HeaderProps {
  storeName?: string;
  tagline?: string;
}

export default function Header({
  storeName = 'DE SEGUNDA',
  tagline = 'Cosas buenas para alguien más.',
}: HeaderProps) {
  return (
    <header className="bg-[#FFE600] border-b border-[#ebd300] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <Link href="/" className="group flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform border border-amber-200">
            <span className="text-2xl" role="img" aria-label="Reciclaje y valor">
              ♻️
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#2D3277] group-hover:text-blue-900 transition leading-none">
              {storeName}
            </h1>
            <p className="text-[11px] text-[#2D3277]/80 font-bold mt-0.5 hidden xs:block">{tagline}</p>
          </div>
        </Link>

        {/* Accesos directos estilo Mercado Libre en PC */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-3 text-xs font-bold text-[#2D3277]">
          <Link
            href="/nuevos"
            className="px-3 py-1.5 rounded-full hover:bg-black/5 transition flex items-center space-x-1"
          >
            <span>🆕</span>
            <span>Nuevos</span>
          </Link>
          <Link
            href="/usados"
            className="px-3 py-1.5 rounded-full hover:bg-black/5 transition flex items-center space-x-1"
          >
            <span>♻️</span>
            <span>Usados</span>
          </Link>
          <Link
            href="/gratis"
            className="px-3 py-1.5 rounded-full hover:bg-black/5 transition flex items-center space-x-1"
          >
            <span>🎁</span>
            <span>Regalos</span>
          </Link>
        </nav>

        {/* Botón de atención por WhatsApp para compradores */}
        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="https://wa.me/573137751715"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#2D3277] bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-full transition border border-[#2D3277]/15 shadow-2xs flex items-center space-x-1.5"
            title="Contacto directo por WhatsApp"
          >
            <span role="img" aria-hidden="true">💬</span>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
}
