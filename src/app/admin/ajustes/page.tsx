'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('DE SEGUNDA');
  const [tagline, setTagline] = useState('Cosas buenas para alguien más.');
  const [whatsappNumber, setWhatsappNumber] = useState('3137751715');
  const [defaultDeliveryArea, setDefaultDeliveryArea] = useState('Cartagena de Indias');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Estados para el módulo de categorías
  const [categories, setCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [catNotice, setCatNotice] = useState('');

  // Cargar ajustes y categorías actuales desde el backend al abrir la página
  useEffect(() => {
    async function fetchData() {
      try {
        const [resSettings, resCategories] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/categories'),
        ]);

        if (resSettings.ok) {
          const data = await resSettings.json();
          if (data.success && data.settings) {
            setStoreName(data.settings.storeName || 'DE SEGUNDA');
            setTagline(data.settings.tagline || 'Cosas buenas para alguien más.');
            setWhatsappNumber(data.settings.whatsappNumber || '3137751715');
            setDefaultDeliveryArea(data.settings.defaultDeliveryArea || 'Cartagena de Indias');
          }
        }

        if (resCategories.ok) {
          const catData = await resCategories.json();
          if (catData.success && Array.isArray(catData.categories)) {
            setCategories(catData.categories);
          }
        }
      } catch (err) {
        console.warn('No se pudieron cargar datos del servidor:', err);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCatNotice('Esa categoría ya existe en la lista');
      setTimeout(() => setCatNotice(''), 3000);
      return;
    }

    setCatSaving(true);
    setCatNotice('');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories);
        setNewCatInput('');
        setCatNotice('✓ Categoría agregada con éxito');
        setTimeout(() => setCatNotice(''), 3000);
      } else {
        setCatNotice(data.error || 'Error al agregar categoría');
      }
    } catch {
      setCatNotice('Error de conexión al agregar categoría');
    } finally {
      setCatSaving(false);
    }
  };

  const handleRemoveCategory = async (catToRemove: string) => {
    if (categories.length <= 1) {
      alert('Debes conservar al menos una categoría en la tienda.');
      return;
    }

    const updated = categories.filter((c) => c !== catToRemove);
    setCatSaving(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories);
        setCatNotice(`✓ Se eliminó «${catToRemove}»`);
        setTimeout(() => setCatNotice(''), 3000);
      }
    } catch {
      setCatNotice('Error al eliminar categoría');
    } finally {
      setCatSaving(false);
    }
  };

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
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300 transition"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <h1 className="text-xl font-black text-slate-900">Ajustes</h1>
        <LogoutButton className="min-h-[38px] px-3 py-1.5 text-xs" label="Salir" />
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
            placeholder="Ej: Cartagena de Indias"
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

      {/* Módulo Editable de Categorías de la Tienda */}
      <div id="categorias" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="font-black text-slate-900 text-base flex items-center space-x-2">
            <span>🏷️</span>
            <span>Módulo de Categorías de la Tienda</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agrega o elimina categorías para tus productos y servicios digitales. Se actualizan automáticamente en los formularios de publicación.
          </p>
        </div>

        {catNotice && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl font-bold animate-in fade-in">
            {catNotice}
          </div>
        )}

        {/* Lista de Categorías actuales */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <div
              key={cat}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 group hover:border-rose-300 transition"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                disabled={catSaving}
                title={`Eliminar categoría ${cat}`}
                className="text-slate-400 hover:text-rose-600 font-black ml-1 text-sm rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Formulario para agregar nueva categoría */}
        <form onSubmit={handleAddCategory} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            disabled={catSaving}
            placeholder="Nueva categoría (ej: Diseño Web, Calzado...)"
            className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={catSaving || !newCatInput.trim()}
            className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition disabled:opacity-50 shrink-0"
          >
            {catSaving ? '...' : '+ AGREGAR'}
          </button>
        </form>
      </div>

      {/* Gestión de Usuarios */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900 text-sm">Usuarios Administradores</h3>
          <p className="text-xs text-slate-500">Crea o elimina accesos al panel /admin</p>
        </div>
        <Link
          href="/admin/usuarios"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition shrink-0"
        >
          Gestionar Usuarios →
        </Link>
      </div>

      {/* Cerrar sesión */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 flex justify-center">
        <LogoutButton className="w-full justify-center" label="Cerrar Sesión del Administrador" />
      </div>
    </div>
  );
}
