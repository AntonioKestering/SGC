// src/app/admin/organizations/new/page.tsx
// Página para criar nova organização

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    full_name: '',
    email: '',
    phone: '',
    status: 'trial' as 'trial' | 'active' | 'inactive',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    async function checkRole() {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          const currentUser = data.users?.find((u: any) => u.id === user.id);
          setUserRole(currentUser?.role || null);

          if (currentUser?.role !== 'super_admin') {
            router.push('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar role:', err);
        router.push('/dashboard');
      } finally {
        setPageLoading(false);
      }
    }

    checkRole();
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar organização');
      }

      router.push('/admin/organizations');
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  }

  if (loading || pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-pink-500">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (userRole !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500">Acesso negado. Apenas super_admin pode acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/admin/organizations')}
          className="flex items-center text-pink-500 hover:text-pink-400 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        <h2 className="text-3xl font-semibold text-zinc-50 mb-6">
          Nova Organização
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
        >
          {error && (
            <div className="bg-red-900 p-4 rounded-lg text-red-200 border border-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              Nome da Organização *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
              placeholder="Ex: Clínica Beleza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              Razão Social
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
              placeholder="Ex: Clínica Beleza LTDA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
              placeholder="contato@clinica.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
              placeholder="(11) 98765-4321"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'trial' | 'active' | 'inactive',
                })
              }
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
            >
              <option value="trial">Trial</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-lg text-white font-medium transition duration-150"
            >
              {saving ? 'Salvando...' : 'Criar Organização'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/organizations')}
              className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition duration-150"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
