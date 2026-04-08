// src/app/users/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { UserCog, Save } from 'lucide-react';
import { formatPhone } from '@/lib/phoneFormatter';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
}

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'faxineira', label: 'Faxineira' },
  { value: 'vendedor', label: 'Vendedor' }
];

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();

  const supabase = getSupabaseClient();

  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('recepcionista');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. FUNÇÃO PARA CARREGAR DADOS DO USUÁRIO
  useEffect(() => {
    async function fetchUser() {
      if (!userId) return;

      console.log('[EditPage] userId:', userId);

      // Busca o perfil na tabela de profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role')
        .eq('id', userId)
        .single();

      console.log('[EditPage] profileData:', profileData);
      console.log('[EditPage] profileError:', profileError);

      if (profileError && profileError.code === '42703') {
        // Coluna não existe, tenta novamente ou continua
        console.warn('[EditPage] Coluna não encontrada, ignorando...');
      } else if (profileError) {
        console.error('[EditPage] Erro ao buscar na tabela profiles:', profileError);
        // Se não encontrou na tabela profiles, tenta buscar via API admin
        try {
          console.log('[EditPage] Tentando buscar via API admin...');
          const res = await fetch('/api/admin/users');
          if (res.ok) {
            const { users } = await res.json();
            const user = users.find((u: any) => u.id === userId);
            if (user) {
              console.log('[EditPage] Usuário encontrado via API:', user);
              const profile = {
                id: user.id,
                email: user.email,
                full_name: user.full_name || '',
                phone: user.phone || '',
                role: user.role || 'recepcionista'
              };
              setUserData(profile);
              setFullName(profile.full_name);
              setPhone(profile.phone || '');
              setRole(profile.role);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.error('[EditPage] Erro ao buscar via API:', apiErr);
        }
        setError('Usuário não encontrado ou erro de carregamento.');
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.error('[EditPage] Nenhum perfil encontrado para o ID:', userId);
        setError('Usuário não encontrado ou erro de carregamento.');
        setLoading(false);
        return;
      }

      const profile = profileData as UserProfile;
      setUserData(profile);
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
      setRole(profile.role);
      setLoading(false);
    }

    fetchUser();
  }, [userId]);

  // 2. FUNÇÃO DE SUBMISSÃO (UPDATE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Se uma nova senha foi fornecida, valida primeiro
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setError('As senhas não correspondem.');
          setLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
      }

      // Atualiza os dados do usuário via API
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          role: role,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao atualizar usuário');
      }

      // Se uma nova senha foi fornecida, atualiza via API
      if (newPassword) {
        const pwRes = await fetch(`/api/admin/users/${userId}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword }),
        });

        if (!pwRes.ok) {
          const errData = await pwRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao atualizar senha');
        }
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // Redireciona após 2 segundos
      setTimeout(() => {
        router.push('/users');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alterações');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-pink-500 text-center py-10">Carregando dados para edição...</div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="text-red-500 text-center py-10">
          {error || 'Não foi possível carregar o usuário.'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
            <UserCog className="w-8 h-8 mr-3 text-pink-500" />
            Editar Usuário: {userData.full_name}
          </h2>
          <p className="mt-2 text-zinc-400">
            Atualize os dados do usuário {userData.email}.
          </p>
        </header>

        {success && (
          <div className="bg-green-900 p-4 rounded-lg text-green-200 mb-6 border border-green-700">
            ✓ Usuário atualizado com sucesso! Redirecionando...
          </div>
        )}

        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
          
          {/* EMAIL (Somente leitura) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-200 mb-1">
              E-mail (Não pode ser alterado)
            </label>
            <input
              type="email"
              id="email"
              value={userData.email}
              disabled
              className="w-full px-4 py-3 bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed"
            />
          </div>

          {/* NOME COMPLETO */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-zinc-200 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* TELEFONE */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-200 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => {
                const rawPhone = e.target.value.replace(/\D/g, '');
                setPhone(rawPhone);
              }}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
            {phone && (
              <p className="text-zinc-400 text-sm mt-2">Formatado: {formatPhone(phone)}</p>
            )}
          </div>

          {/* PAPEL/ROLE */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-200 mb-1">
              Papel *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* SEÇÃO DE MUDANÇA DE SENHA */}
          <div className="border-t border-zinc-700 pt-6">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Alterar Senha (Opcional)</h3>

            {/* NOVA SENHA */}
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-200 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
              {newPassword && (
                <p className="text-xs text-zinc-400 mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            {/* CONFIRMAR SENHA */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-200 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>
          </div>

          {/* BOTÃO DE SUBMISSÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-medium text-white 
                       bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-pink-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
