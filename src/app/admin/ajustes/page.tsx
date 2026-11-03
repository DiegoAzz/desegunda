'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('LO TENGO');
  const [tagline, setTagline] = useState('Cosas buenas para alguien más.');
  const [whatsappNumber, setWhatsappNumber] = useState('3137751715');
  const [defaultDeliveryArea, setDefaultDeliveryArea] = useState('Bogotá, Colombia');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          tagline,
          whatsappNumber,
          defaultDeliveryArea,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        setError(data.error || 'Error al guardar los ajustes');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300 transition"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <h1 className="text-xl font-black text-slate-900">Ajustes de la Tienda</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-3 rounded-xl font-bold">
          ✓ Ajustes guardados correctamente
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Nombre de la Tienda
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Eslogan
          </label>
          <input
            type="text"
            required
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-medium text-slate-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Número de WhatsApp
          </label>
          <input
            type="text"
            required
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="3137751715"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-bold text-slate-900"
          />
          <p className="text-xs text-slate-400 mt-1">
            Se normaliza automáticamente a <code>573137751715</code> para wa.me.
          </p>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Zona de Entrega Predeterminada
          </label>
          <input
            type="text"
            required
            value={defaultDeliveryArea}
            onChange={(e) => setDefaultDeliveryArea(e.target.value)}
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-medium text-slate-900 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[56px] bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg transition shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'GUARDAR AJUSTES'}
        </button>
      </form>

      <div className="bg-white rounded-3xl p-4 border border-slate-200 text-center">
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-bold text-rose-600 hover:text-rose-800 transition"
        >
          Cerrar Sesión del Administrador
        </button>
      </div>
    </div>
  );
}
