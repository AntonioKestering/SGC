// src/app/specialists/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { UserCog, PlusCircle } from 'lucide-react';

// Tipagem para os dados combinados (Specialist + Profile)
interface SpecialistData {
  id: string;
  specialty: string;
  registry_number: string | null;
  color_code: string;
  profile_id?: string | null;
  full_name?: string;
  email?: string;
  // Supabase JOIN resulta em um objeto aninhado 'profiles'
  profiles: { full_name: string; email: string }[];
}

export default function SpecialistsIndexPage() {
  const router = useRouter();
  const [specialists, setSpecialists] = useState<SpecialistData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  // 1. FUNÇÃO PARA BUSCAR ESPECIALISTAS
  useEffect(() => {
    async function fetchSpecialists() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/specialists');
        const json = await response.json();
        
        if (!response.ok) {
          console.error('Erro ao carregar especialistas:', json.error);
          setSpecialists([]);
        } else {
          setSpecialists(json.specialists as SpecialistData[]);
        }
      } catch (err) {
        console.error('Erro ao buscar especialistas:', err);
        setSpecialists([]);
      }
      setLoading(false);
    }
    fetchSpecialists();
  }, []);

  // Função para excluir especialista com confirmação
  async function handleDelete(id: string) {
    const confirmed = window.confirm('Tem certeza que deseja excluir este especialista? Esta ação não poderá ser desfeita.');
    if (!confirmed) return;
    const { error } = await supabase.from('specialists').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir especialista: ' + error.message);
      return;
    }
    setSpecialists((prev) => prev.filter((s) => s.id !== id));
  }

  // 2. ESTRUTURA E ESTILO DA TELA
  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <UserCog className="w-8 h-8 mr-3 text-pink-500" /> 
          Gerenciamento de Especialistas
        </h2>
        
        {/* BOTÃO PARA NOVO CADASTRO */}
        <button
          onClick={() => router.push('/specialists/new')}
          className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white 
                     bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-pink-500 focus:ring-offset-zinc-900 transition duration-150"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Especialista
        </button>
      </header>

      <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-800">
        {loading && (
          <p className="text-pink-500 text-center py-8">Carregando dados dos especialistas...</p>
        )}
        
        {!loading && specialists.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400">Nenhum especialista cadastrado ainda.</p>
            <button
                onClick={() => router.push('/specialists/new')}
                className="mt-4 text-pink-500 hover:text-pink-400 transition"
            >
                Clique aqui para cadastrar o primeiro.
            </button>
          </div>
        )}

        {/* 3. TABELA DE EXIBIÇÃO */}
        {!loading && specialists.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead>
                <tr>
                  {['Nome', 'Email', 'Especialidade', 'Registro', 'Cor', 'Ações'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {specialists.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">
                      {s.full_name || s.profiles[0]?.full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {s.email || s.profiles[0]?.email || ''}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {s.specialty}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {s.registry_number || 'Não Informado'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div 
                        className="w-4 h-4 rounded-full shadow" 
                        style={{ backgroundColor: s.color_code }}
                        title={s.color_code}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                      <button
                        onClick={() => router.push(`/specialists/${s.id}/edit`)}
                        className="text-pink-500 hover:text-pink-400 transition duration-150"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
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