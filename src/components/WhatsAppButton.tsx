import { ProductItem } from '@/lib/types';
import { buildWhatsAppUrl, WhatsAppAction } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  product: ProductItem;
  action?: WhatsAppAction;
  whatsappNumber?: string;
  baseUrl?: string;
  className?: string;
}

export default function WhatsAppButton({
  product,
  action = 'interest',
  whatsappNumber = '573137751715',
  baseUrl,
  className = '',
}: WhatsAppButtonProps) {
  const isAvailable = product.status === 'AVAILABLE';

  // Si no está disponible, renderizar botón inactivo con estado
  if (!isAvailable) {
    let label = 'NO DISPONIBLE';
    if (product.status === 'RESERVED') label = 'ARTÍCULO RESERVADO';
    if (product.status === 'SOLD') label = 'ARTÍCULO VENDIDO';
    if (product.status === 'GIVEN_AWAY') label = 'REGALO YA ENTREGADO';

    return (
      <button
        disabled
        className={`w-full min-h-[56px] px-6 py-4 rounded-2xl bg-slate-200 text-slate-500 font-bold text-lg cursor-not-allowed flex items-center justify-center space-x-2 border-2 border-slate-300 ${className}`}
      >
        <span>🔒</span>
        <span>{label}</span>
      </button>
    );
  }

  // Textos exactos requeridos por el PRD
  let buttonText = 'ME INTERESA';
  let bgClasses = 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20';

  if (product.type === 'GIFT' || action === 'gift') {
    buttonText = 'QUIERO ESTE REGALO';
    bgClasses = 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20';
  } else if (action === 'offer') {
    buttonText = 'HACER OFERTA';
    bgClasses = 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/20';
  }

  const url = buildWhatsAppUrl({
    product,
    action,
    phoneNumber: whatsappNumber,
    baseUrl,
  });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full min-h-[56px] px-6 py-4 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] ${bgClasses} ${className}`}
    >
      <span className="text-2xl" role="img" aria-hidden="true">
        💬
      </span>
      <span>{buttonText}</span>
    </a>
  );
}
