// src/app/admin/organizations/page.tsx
// Página de listagem de organizações

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Building2, PlusCircle, Edit2, Trash2 } from 'lucide-react';

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

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Verificar se usuário é super_admin
  useEffect(() => {
    if (loading) return;

    async function checkRole() {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/users', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          const currentUser = data.users?.find((u: any) => u.id === user.id);
          setUserRole(currentUser?.role || null);

          if (currentUser?.role !== 'super_admin') {
            router.push('/dashboard');
            return;
          }

          // Se é super_admin, carrega as organizações
          fetchOrganizations();
        }
      } catch (err) {
        console.error('Erro ao verificar role:', err);
        router.push('/dashboard');
      }
    }

    checkRole();
  }, [user, loading, router]);

  async function fetchOrganizations() {
    try {
      const res = await fetch('/api/admin/organizations');
      if (!res.ok) {
        console.error('Erro ao buscar organizações:', res.statusText);
        return;
      }
      const data = await res.json();
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('Erro ao buscar organizações:', err);
    } finally {
      setPageLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Tem certeza que deseja deletar esta organização? Todos os usuários e dados relacionados serão deletados.');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao deletar: ' + (err.error || res.statusText));
        return;
      }
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert('Erro ao deletar: ' + (err.message || String(err)));
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'trial':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
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
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-pink-500" />
            Gerenciamento de Organizações
          </h2>
          <button
            onClick={() => router.push('/admin/organizations/new')}
            className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 transition duration-150"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Nova Organização
          </button>
        </header>

        <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-800">
          {pageLoading ? (
            <p className="text-pink-500 text-center py-8">Carregando organizações...</p>
          ) : organizations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-400">Nenhuma organização cadastrada ainda.</p>
              <button
                onClick={() => router.push('/admin/organizations/new')}
                className="mt-4 text-pink-500 hover:text-pink-400 underline"
              >
                Criar a primeira organização
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left border-b border-zinc-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-zinc-300">Nome</th>
                    <th className="py-3 px-4 font-semibold text-zinc-300">E-mail</th>
                    <th className="py-3 px-4 font-semibold text-zinc-300">Telefone</th>
                    <th className="py-3 px-4 font-semibold text-zinc-300">Status</th>
                    <th className="py-3 px-4 font-semibold text-zinc-300">Criado em</th>
                    <th className="py-3 px-4 font-semibold text-zinc-300 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {organizations.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-zinc-200">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          {org.full_name && (
                            <p className="text-xs text-zinc-500">{org.full_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-zinc-400">
                        {org.email || '-'}
                      </td>
                      <td className="py-4 px-4 text-zinc-400">
                        {org.phone || '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(org.status)}`}
                        >
                          {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">
                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/organizations/${org.id}/edit`
                              )
                            }
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(org.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
