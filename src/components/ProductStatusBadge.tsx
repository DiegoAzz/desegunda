import { ProductCondition, ProductStatus, ProductType } from '@/lib/types';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

export function ProductStatusBadge({ status, className = '' }: ProductStatusBadgeProps) {
  if (status === 'AVAILABLE') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300 ${className}`}
      >
        ● DISPONIBLE
      </span>
    );
  }

  if (status === 'RESERVED') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
      >
        ⏳ RESERVADO
      </span>
    );
  }

  if (status === 'SOLD') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-400 ${className}`}
      >
        ✓ VENDIDO
      </span>
    );
  }

  if (status === 'GIVEN_AWAY') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 ${className}`}
      >
        🎁 ENTREGADO
      </span>
    );
  }

  return null;
}

interface ProductTypeBadgeProps {
  type: ProductType;
  condition?: ProductCondition | null;
  className?: string;
}

export function ProductTypeBadge({ type, condition, className = '' }: ProductTypeBadgeProps) {
  if (type === 'GIFT') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs ${className}`}
      >
        🎁 REGALO
      </span>
    );
  }

  if (type === 'NEW') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs ${className}`}
      >
        🆕 NUEVO
      </span>
    );
  }

  if (type === 'DIGITAL') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs ${className}`}
      >
        💻 DIGITAL
      </span>
    );
  }

  // USED
  if (condition === 'DAMAGED') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse ${className}`}
      >
        ⚠️ DAÑADO
      </span>
    );
  }

  if (condition === 'DETAILS') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-xs ${className}`}
      >
        ♻️ CON DETALLES
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs ${className}`}
    >
      ♻️ USADO
    </span>
  );
}
