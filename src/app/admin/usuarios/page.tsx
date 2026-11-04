'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

interface AdminUserView {
  id: string;
  email: string;
  createdAt: string;
  isMaster?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.warn('Error cargando usuarios:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`¡Usuario ${data.user.email} creado con éxito!`);
        setEmail('');
        setPassword('');
        fetchUsers();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Error creando usuario');
      }
    } catch {
      setErrorMsg('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: AdminUserView) => {
    if (user.isMaster) {
      alert('El usuario administrador principal no puede ser eliminado.');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el acceso para «${user.email}»?`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setSuccessMsg(`Usuario ${user.email} eliminado.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(data.error || 'No se pudo eliminar el usuario');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Barra Superior */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300 transition"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
          Usuarios Administradores
        </h1>
        <LogoutButton className="min-h-[38px] px-3 py-1.5 text-xs" label="Salir" />
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm p-4 rounded-2xl font-bold flex items-center space-x-2">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm p-4 rounded-2xl font-bold flex items-center space-x-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario Crear Usuario */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <span className="text-2xl">👤</span>
          <div>
            <h2 className="text-lg font-black text-slate-900">Crear Nuevo Usuario</h2>
            <p className="text-xs text-slate-500">
              Podrá iniciar sesión en /admin y publicar, editar o eliminar productos.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nuevo.admin@ejemplo.com"
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-semibold text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Contraseña * (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-semibold text-slate-900 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-base flex items-center justify-center space-x-2 shadow-xs transition active:scale-[0.99] disabled:opacity-50"
          >
            <span>+</span>
            <span>{loading ? 'CREANDO...' : 'CREAR USUARIO'}</span>
          </button>
        </form>
      </div>

      {/* Lista de Usuarios Registrados */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">
            Usuarios con Acceso ({users.length})
          </h2>
          <span className="text-xs font-bold text-slate-400">Acceso a /admin</span>
        </div>

        {fetching ? (
          <p className="text-sm text-slate-500 py-4 text-center">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No hay usuarios adicionales.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const isDeleting = deletingId === u.id;
              return (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{u.email}</span>
                      {u.isMaster ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                          Principal
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Registrado: {new Date(u.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>

                  {!u.isMaster && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteUser(u)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition disabled:opacity-50 shrink-0"
                    >
                      {isDeleting ? 'Borrando...' : 'ELIMINAR'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
