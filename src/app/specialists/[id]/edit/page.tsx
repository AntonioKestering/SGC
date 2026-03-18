// src/app/specialists/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { UserCog, Save } from 'lucide-react';

// Tipagem para os dados combinados (Specialist + Profile)
interface SpecialistData {
  id: string;
  specialty: string;
  registry_number: string | null;
  color_code: string;
  profiles: { full_name: string; email: string }[];
}

// O Next.js passa o ID do especialista através da URL (useParams)
export default function EditSpecialistPage() {
  const params = useParams();
  const specialistId = params.id as string;
  const router = useRouter();
  
  // Estado dos dados do especialista
  const [specialistData, setSpecialistData] = useState<SpecialistData | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [registryNumber, setRegistryNumber] = useState('');
  const [colorCode, setColorCode] = useState('');
  
  // Estados da UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. FUNÇÃO PARA CARREGAR DADOS EXISTENTES (useEffect)
  useEffect(() => {
    async function fetchSpecialist() {
      if (!specialistId) return;
      
      try {
        const response = await fetch(`/api/specialists/${specialistId}`);
        const json = await response.json();
        
        if (!response.ok) {
          console.error('Erro ao carregar especialista:', json.error);
          setError('Especialista não encontrado ou erro de carregamento.');
          setLoading(false);
          return;
        }
        
        const specialist = json.specialist as SpecialistData;
        setSpecialistData(specialist);
        
        // Pré-preenche os estados do formulário
        setSpecialty(specialist.specialty);
        setRegistryNumber(specialist.registry_number || '');
        setColorCode(specialist.color_code);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar especialista:', err);
        setError('Erro ao carregar dados do especialista.');
        setLoading(false);
      }
    }
    fetchSpecialist();
  }, [specialistId]);

  // 2. FUNÇÃO DE SUBMISSÃO (UPDATE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // DADOS PARA ATUALIZAÇÃO
    const updates = { 
      specialty: specialty,
      registry_number: registryNumber || null,
      color_code: colorCode,
    };

    // 3. COMANDO DE ATUALIZAÇÃO NO SUPABASE
    const { error: updateError } = await supabase
      .from('specialists')
      .update(updates)
      .eq('id', specialistId); // CONDIÇÃO: Onde o ID do registro é igual ao ID da URL

    setLoading(false);

    if (updateError) {
      console.error('Erro ao atualizar especialista:', updateError);
      setError(`Erro ao atualizar: ${updateError.message}`);
      return;
    }

    // Sucesso
    alert('Especialista atualizado com sucesso!');
    router.push('/specialists'); // Redireciona para a lista
  };

  // 4. ESTRUTURA E ESTILO DO FORMULÁRIO (REUTILIZAÇÃO)
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-pink-500 text-center py-10">Carregando dados para edição...</div>
      </DashboardLayout>
    );
  }

  if (!specialistData) {
      return (
          <DashboardLayout>
              <div className="text-red-500 text-center py-10">
                  {error || 'Não foi possível carregar o especialista.'}
              </div>
          </DashboardLayout>
      );
  }
  
  // Renderiza o formulário pré-preenchido
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
            <UserCog className="w-8 h-8 mr-3 text-pink-500" /> 
            Editar Especialista: {specialistData.full_name || specialistData.profiles[0]?.full_name}
          </h2>
          <p className="mt-2 text-zinc-400">
            Ajustando dados de {specialistData.email || specialistData.profiles[0]?.email}.
          </p>
        </header>

        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
          
          {/* OBS: O Perfil (Profile ID) NÃO pode ser alterado por esta tela */}
          <div className="text-zinc-500 bg-zinc-800 p-3 rounded-lg">
             Funcionário Vinculado: <span className="text-zinc-100 font-semibold">{specialistData.full_name || specialistData.profiles[0]?.full_name}</span> <span className="text-zinc-400">({specialistData.email || specialistData.profiles[0]?.email})</span>
          </div>

          {/* CAMPO 2: ESPECIALIDADE */}
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-zinc-200 mb-1">
              Especialidade *
            </label>
            <input
              type="text"
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* CAMPO 3: REGISTRO (OPCIONAL) */}
          <div>
            <label htmlFor="registryNumber" className="block text-sm font-medium text-zinc-200 mb-1">
              Número de Registro
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
          <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                  <label htmlFor="colorCode" className="block text-sm font-medium text-zinc-200 mb-1">
                      Cor no Calendário
                  </label>
                  <input
                      type="color" // Usamos type="color" para um seletor visual
                      id="colorCode"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value)}
                      className="w-full px-4 py-1 h-12 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                  />
              </div>
              
              <div className="flex-shrink-0">
                  <span className="block text-sm font-medium text-zinc-200 mb-1">Preview:</span>
                  <div 
                    style={{ backgroundColor: colorCode }}
                    className="w-12 h-12 rounded-full shadow-md border-2 border-zinc-700"
                    title={`Cor: ${colorCode}`}
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