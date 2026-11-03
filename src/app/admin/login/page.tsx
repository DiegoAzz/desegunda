'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Credenciales inválidas');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('Error de conexión al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl block">🔐</span>
          <h1 className="text-2xl font-black text-slate-900">Panel Administrativo</h1>
          <p className="text-xs text-slate-500">
            Acceso exclusivo para el propietario de LO TENGO
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3 rounded-xl font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lotengo.local"
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 font-medium text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[56px] bg-slate-900 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'INGRESAR'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline">
            ← Volver a la tienda pública
          </Link>
        </div>
      </div>
    </div>
  );
}
