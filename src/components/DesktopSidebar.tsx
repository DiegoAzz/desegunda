'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  active: boolean;
  isExternal?: boolean;
}

export default function DesktopSidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      icon: '🏪',
      href: '/',
      active: pathname === '/',
    },
    {
      id: 'nuevos',
      label: 'Nuevos',
      icon: '🆕',
      href: '/nuevos',
      active: pathname === '/nuevos',
    },
    {
      id: 'usados',
      label: 'Usados',
      icon: '♻️',
      href: '/usados',
      active: pathname === '/usados',
    },
    {
      id: 'gratis',
      label: 'Regalos (Gratis)',
      icon: '🎁',
      href: '/gratis',
      active: pathname === '/gratis',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Directo',
      icon: '💬',
      href: 'https://wa.me/573137751715',
      isExternal: true,
      active: false,
    },
  ];

  const handleSearchFocus = () => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.location.href = '/';
    }
  };

  return (
    <aside
      aria-label="Barra lateral de navegación para PC"
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-slate-200 z-40 flex-col items-center justify-between py-4 shadow-xs select-none"
    >
      {/* Top: Menú / Logo Icon */}
      <div className="flex flex-col items-center space-y-4 w-full">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-[#FFE600] flex items-center justify-center text-xl shadow-xs hover:scale-105 transition-transform"
          title="DE SEGUNDA — Inicio"
        >
          <span role="img" aria-label="Logo">♻️</span>
        </Link>

        <div className="w-8 h-px bg-slate-200" />

        {/* Lista de Botones Principales */}
        <nav className="flex flex-col items-center space-y-2 w-full px-2">
          {navItems.map((item) => {
            const Component = item.isExternal ? 'a' : Link;
            const extraProps = item.isExternal
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <Component
                key={item.id}
                href={item.href}
                {...extraProps}
                className={`relative group w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  item.active
                    ? 'bg-[#FFE600] text-[#2D3277] shadow-xs font-bold border border-[#ebd300]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.icon}</span>

                {/* Línea indicadora activa estilo Mercado Libre */}
                {item.active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#2D3277] rounded-r-full" />
                )}

                {/* Tooltip flotante a la derecha en PC */}
                <span className="absolute left-14 opacity-0 group-hover:opacity-100 invisible group-hover:visible bg-[#2D3277] text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap transition-all duration-150 z-50 pointer-events-none">
                  {item.label}
                </span>
              </Component>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Botón de Búsqueda Rápida */}
      <div className="flex flex-col items-center space-y-3 w-full px-2">
        <button
          type="button"
          onClick={handleSearchFocus}
          className="relative group w-11 h-11 rounded-xl flex items-center justify-center text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
          title="Buscar productos"
        >
          <span>🔍</span>
          <span className="absolute left-14 opacity-0 group-hover:opacity-100 invisible group-hover:visible bg-[#2D3277] text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap transition-all duration-150 z-50 pointer-events-none">
            Buscar
          </span>
        </button>
      </div>
    </aside>
  );
}
