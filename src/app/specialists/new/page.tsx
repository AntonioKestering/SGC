// src/app/specialists/new/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { UserCog } from 'lucide-react';

// Tipagem simples para o perfil que vamos buscar
interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export default function NewSpecialistPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  
  // Estado dos dados do especialista
  const [profileId, setProfileId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [registryNumber, setRegistryNumber] = useState('');
  const [colorCode, setColorCode] = useState('#ec4899'); // Cor padrão (Pink/Magenta)
  
  // Estados da UI
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. FUNÇÃO PARA BUSCAR PERFIS (PARA VINCULAÇÃO)
  useEffect(() => {
    async function fetchProfiles() {
      // BUSCA PERFIS BÁSICOS (usuários/funcionários)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        // Você pode adicionar um filtro aqui para excluir quem já é especialista
        .limit(10); 

      if (error) {
        console.error('Erro ao carregar perfis:', error);
        return;
      }
      setProfiles(data as Profile[]);
      // Define o primeiro perfil como selecionado por padrão
      if (data.length > 0) {
          setProfileId(data[0].id);
      }
    }
    fetchProfiles();
  }, []);

  // 2. FUNÇÃO DE SUBMISSÃO DO FORMULÁRIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação básica
    if (!profileId || !specialty) {
        setError('Por favor, selecione um funcionário e insira a especialidade.');
        setLoading(false);
        return;
    }

    // 3. INSERÇÃO NO BANCO DE DADOS
    const { error: insertError } = await supabase
      .from('specialists')
      .insert([
        { 
          profile_id: profileId,
          specialty: specialty,
          registry_number: registryNumber || null, // Permite nulo
          color_code: colorCode,
        },
      ]);

    setLoading(false);

    if (insertError) {
      console.error('Erro ao cadastrar especialista:', insertError);
      setError(`Erro ao cadastrar: ${insertError.message}`);
      return;
    }

    // Sucesso
    alert('Especialista cadastrado com sucesso!');
    router.push('/dashboard'); // Redireciona de volta ao dashboard ou para a lista de especialistas
  };

  // 4. ESTRUTURA E ESTILO DO FORMULÁRIO
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
            <UserCog className="w-8 h-8 mr-3 text-pink-500" /> 
            Novo Cadastro de Especialista
          </h2>
          <p className="mt-2 text-zinc-400">
            Vincule um funcionário existente ao cargo de especialista e defina sua área de atuação.
          </p>
        </header>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">
            {error}
          </div>
        )}
        
        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
          
          {/* CAMPO 1: VINCULAÇÃO DE PERFIL */}
          <div>
            <label htmlFor="profileId" className="block text-sm font-medium text-zinc-200 mb-1">
              Funcionário/Perfil *
            </label>
            <select
              id="profileId"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            >
                {profiles.length === 0 ? (
                    <option value="">Carregando Perfis...</option>
                ) : (
                    profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.full_name} ({p.email})
                        </option>
                    ))
                )}
            </select>
            {profiles.length === 0 && <p className="text-xs text-yellow-500 mt-1">Nenhum perfil encontrado para vincular.</p>}
          </div>

          {/* CAMPO 2: ESPECIALIDADE */}
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-zinc-200 mb-1">
              Especialidade (Ex: Biomédica Esteta, Massoterapeuta) *
            </label>
            <input
              type="text"
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              required
              placeholder="Ex: Fisioterapeuta Dermato Funcional"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* CAMPO 3: REGISTRO (OPCIONAL) */}
          <div>
            <label htmlFor="registryNumber" className="block text-sm font-medium text-zinc-200 mb-1">
              Número de Registro (Ex: Crefito, CRM, COREN - Opcional)
            </label>
            <input
              type="text"
              id="registryNumber"
              value={registryNumber}
              onChange={(e) => setRegistryNumber(e.target.value)}
              placeholder="Ex: 123456/SP"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* CAMPO 4: CÓDIGO DE COR */}
          <div>
            <label htmlFor="colorCode" className="block text-sm font-medium text-zinc-200 mb-1">
              Cor no Calendário (Para Agendamentos)
            </label>
            <input
              type="color"
              id="colorCode"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              className="w-24 h-12 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-pink-500 focus:border-pink-500 transition duration-150 p-1"
            />
          </div>

          {/* BOTÃO DE SUBMISSÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white 
                       bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 
                       focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Especialista'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}