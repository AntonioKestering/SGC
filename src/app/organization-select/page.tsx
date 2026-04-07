'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Building2, LogOut, ArrowRight } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  role: string;
}

export default function SelectOrganizationPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrganizations() {
      try {
        setLoading(true);
        setError(null);

        // 1. Verificar se há sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // 2. Buscar organizações do usuário via API
        const token = session.access_token;
        const response = await fetch('/api/user/organizations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar organizações');
        }

        const data = await response.json();
        setOrganizations(data.organizations || []);

        // 3. Se houver apenas 1 organização, ir direto para o dashboard
        if (data.organizations?.length === 1) {
          selectOrganization(data.organizations[0].id);
          return;
        }

        // 4. Se não houver nenhuma organização, redirecionar
        if (!data.organizations || data.organizations.length === 0) {
          setError('Nenhuma organização encontrada. Entre em contato com o administrador.');
        }
      } catch (err: any) {
        console.error('Erro ao carregar organizações:', err);
        setError(err.message || 'Erro ao carregar organizações');
      } finally {
        setLoading(false);
      }
    }

    loadOrganizations();
  }, []);

  const selectOrganization = async (orgId: string) => {
    try {
      setSelectedOrgId(orgId);
      
      // Aqui você pode fazer uma chamada à API para salvar a seleção na sessão
      // Por enquanto, vamos guardar no localStorage e ir para o dashboard
      localStorage.setItem('selected_organization_id', orgId);
      
      // Pequeno delay para UX
      setTimeout(() => {
        router.push('/dashboard');
      }, 300);
    } catch (err) {
      console.error('Erro ao selecionar organização:', err);
      setError('Erro ao selecionar organização');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-400">Carregando organizações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-8 h-8 text-pink-500" />
            <h1 className="text-2xl font-bold text-zinc-50">Selecione uma Organização</h1>
          </div>
          <p className="text-zinc-400">
            Você pertence a múltiplas organizações. Escolha qual deseja acessar:
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Organizations Grid */}
        {organizations.length > 0 && (
          <div className="space-y-3 mb-6">
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => selectOrganization(org.id)}
                disabled={selectedOrgId !== null && selectedOrgId !== org.id}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left group
                  ${
                    selectedOrgId === org.id
                      ? 'bg-pink-500/20 border-pink-500'
                      : 'bg-zinc-900 border-zinc-700 hover:border-pink-500 hover:bg-zinc-800'
                  }
                  ${selectedOrgId !== null && selectedOrgId !== org.id ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-50">{org.name}</p>
                    <p className="text-sm text-zinc-400 capitalize">{org.role}</p>
                  </div>
                  <ArrowRight className={`w-5 h-5 transition-all
                    ${
                      selectedOrgId === org.id
                        ? 'text-pink-500'
                        : 'text-zinc-600 group-hover:text-pink-500'
                    }
                  `} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Fazer logout
        </button>
      </div>
    </div>
  );
}
