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
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Cargar ajustes actuales desde el backend al abrir la página
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setStoreName(data.settings.storeName || 'LO TENGO');
            setTagline(data.settings.tagline || 'Cosas buenas para alguien más.');
            setWhatsappNumber(data.settings.whatsappNumber || '3137751715');
            setDefaultDeliveryArea(data.settings.defaultDeliveryArea || 'Bogotá, Colombia');
          }
        }
      } catch (err) {
        console.warn('No se pudieron cargar los ajustes del servidor:', err);
      } finally {
        setFetching(false);
      }
    }
    fetchSettings();
  }, []);

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
          storeName: storeName.trim(),
          tagline: tagline.trim(),
          whatsappNumber: whatsappNumber.trim(),
          defaultDeliveryArea: defaultDeliveryArea.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
        router.refresh();
      } else {
        setError(data.error || 'Error al guardar los ajustes');
      }
    } catch {
      setError('Error de conexión al guardar los ajustes');
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
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm p-4 rounded-2xl font-bold shadow-xs flex items-center space-x-2 animate-in fade-in">
          <span className="text-lg">✓</span>
          <span>¡Ajustes guardados correctamente! El nuevo nombre ya está activo en tu tienda.</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3.5 rounded-2xl font-bold flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        {fetching && (
          <p className="text-xs text-slate-400 font-medium">Cargando ajustes actuales...</p>
        )}

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Nombre de la Tienda *
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            disabled={loading}
            placeholder="Ej: LO TENGO"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-bold text-slate-900 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Eslogan
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            disabled={loading}
            placeholder="Ej: Cosas buenas para alguien más."
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-medium text-slate-800 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Número de WhatsApp *
          </label>
          <input
            type="tel"
            required
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            disabled={loading}
            placeholder="Ej: 3137751715"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-bold text-slate-900 disabled:opacity-50"
          />
          <p className="text-xs text-slate-400 mt-1">
            Se normaliza automáticamente a formato internacional para WhatsApp.
          </p>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Zona de Entrega Predeterminada
          </label>
          <input
            type="text"
            value={defaultDeliveryArea}
            onChange={(e) => setDefaultDeliveryArea(e.target.value)}
            disabled={loading}
            placeholder="Ej: Bogotá, Colombia (Zona Norte)"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-medium text-slate-800 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[52px] bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-2xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 mt-2"
        >
          {loading ? 'Guardando ajustes...' : 'GUARDAR AJUSTES'}
        </button>
      </form>

      {/* Cerrar sesión */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 text-center">
        <button
          onClick={handleLogout}
          type="button"
          className="text-xs font-bold text-rose-600 hover:text-rose-800 py-2 px-4 transition"
        >
          Cerrar Sesión del Administrador
        </button>
      </div>
    </div>
  );
}
