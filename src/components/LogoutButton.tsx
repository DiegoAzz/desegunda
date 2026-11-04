'use client';

import { useState } from 'react';

interface LogoutButtonProps {
  className?: string;
  showIcon?: boolean;
  label?: string;
  variant?: 'danger' | 'ghost' | 'pill';
}

export default function LogoutButton({
  className = '',
  showIcon = true,
  label = 'Cerrar Sesión',
  variant = 'pill',
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    // Limpieza radical de cookies y navegación directa a login
    window.location.href = '/admin/login';
  };

  const baseStyle =
    variant === 'danger'
      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs'
      : variant === 'pill'
      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl border border-rose-200 shadow-2xs'
      : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50';

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`min-h-[44px] font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50 ${baseStyle} ${className}`}
      title="Cerrar sesión de administrador de forma segura"
    >
      {showIcon && <span aria-hidden="true">🚪</span>}
      <span>{loading ? 'Saliendo...' : label}</span>
    </button>
  );
}
