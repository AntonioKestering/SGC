// src/app/admin/organizations/[id]/edit/page.tsx
// Página para editar organização

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  full_name?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'trial';
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const id = params.id as string;

  const [userRole, setUserRole] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
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

    async function checkRoleAndFetchOrg() {
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

          // Se é super_admin, carrega a organização
          const orgRes = await fetch(`/api/admin/organizations/${id}`);
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            setOrganization(orgData.organization);
            setFormData({
              name: orgData.organization.name,
              full_name: orgData.organization.full_name || '',
              email: orgData.organization.email || '',
              phone: orgData.organization.phone || '',
              status: orgData.organization.status,
            });
          } else {
            setError('Organização não encontrada');
          }
        }
      } catch (err) {
        console.error('Erro:', err);
        setError('Erro ao carregar dados');
      } finally {
        setPageLoading(false);
      }
    }

    checkRoleAndFetchOrg();
  }, [user, loading, router, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar organização');
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
          Editar Organização
        </h2>

        {!organization ? (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 border border-red-700">
            Organização não encontrada
          </div>
        ) : (
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
                {saving ? 'Salvando...' : 'Atualizar Organização'}
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
        )}
      </div>
    </DashboardLayout>
  );
}
