// src/app/users/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserCog, PlusCircle } from 'lucide-react';
import { formatPhone } from '@/lib/phoneFormatter';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        console.log('[Page] Buscando usuários de /api/admin/users');
        const res = await fetch('/api/admin/users');
        
        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Page] Erro HTTP ${res.status}:`, errText);
          try {
            const errJson = JSON.parse(errText);
            console.error('[Page] Erro do servidor:', errJson);
          } catch {}
          setUsers([]);
          return;
        }
        
        const json = await res.json();
        console.log('[Page] Resposta recebida:', json);
        setUsers((json.users || []).map((u: any) => ({ 
          id: u.id, 
          email: u.email,
          full_name: u.full_name,
          phone: u.phone || '',
          role: u.role
        })));
      } catch (err) {
        console.error('[Page] Erro ao buscar /api/admin/users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não poderá ser desfeita.');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao excluir usuário: ' + (err.error || res.statusText));
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir usuário: ' + (err.message || String(err)));
    }
  }

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <UserCog className="w-8 h-8 mr-3 text-pink-500" />
          Gerenciamento de Usuários
        </h2>
        <button
          onClick={() => router.push('/users/new')}
          className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 transition duration-150"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Usuário
        </button>
      </header>

      <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-800">
        {loading && (
          <p className="text-pink-500 text-center py-8">Carregando dados dos usuários...</p>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400">Nenhum usuário cadastrado ainda.</p>
            <button
              onClick={() => router.push('/users/new')}
              className="mt-4 text-pink-500 hover:text-pink-400 transition"
            >
              Clique aqui para cadastrar o primeiro.
            </button>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Telefone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Papel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">{u.full_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{u.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatPhone(u.phone) || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                      <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-zinc-200">
                        {u.role === 'admin' ? 'Administrador' : u.role === 'especialista' ? 'Especialista' : 'Recepcionista'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                      <button
                        onClick={() => router.push(`/users/${u.id}/edit`)}
                        className="text-pink-500 hover:text-pink-400 transition duration-150"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-pink-500 hover:text-red-400 transition duration-150"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
