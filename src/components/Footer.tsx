interface FooterProps {
  storeName?: string;
}

export default function Footer({ storeName = 'DE SEGUNDA' }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-300/70 mt-12 py-8 text-center text-slate-600">
      <div className="max-w-2xl mx-auto px-4 space-y-3">
        <div className="text-xl font-black text-[#2D3277] flex items-center justify-center space-x-1.5">
          <span>♻️</span>
          <span>{storeName}</span>
        </div>
        <p className="text-sm">
          Tienda personal. Todos los artículos son de mi propiedad personal.
          <br />
          Contacto directo por WhatsApp o pago seguro en línea con Wompi Bancolombia.
        </p>
        <p className="text-xs text-slate-400">
          Sin registros para compradores • Pagos seguros con Wompi (PSE, Nequi, Bancolombia, Tarjetas) • 100 % transparente
        </p>
      </div>
    </footer>
  );
}
