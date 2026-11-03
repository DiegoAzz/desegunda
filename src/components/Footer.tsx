import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-8 text-center text-slate-600">
      <div className="max-w-2xl mx-auto px-4 space-y-3">
        <div className="text-xl font-bold text-slate-900 flex items-center justify-center space-x-1">
          <span>♻️</span>
          <span>LO TENGO</span>
        </div>
        <p className="text-sm">
          Tienda personal. Todos los artículos son de mi propiedad personal.
          <br />
          Contacto directo por WhatsApp o pago seguro en línea con Wompi Bancolombia.
        </p>
        <p className="text-xs text-slate-400">
          Sin registros para compradores • Pagos seguros con Wompi (PSE, Nequi, Bancolombia, Tarjetas) • 100 % transparente
        </p>
        <div className="pt-2">
          <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-600 underline">
            Panel de Administración
          </Link>
        </div>
      </div>
    </footer>
  );
}
