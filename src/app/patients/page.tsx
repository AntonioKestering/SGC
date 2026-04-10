// src/app/patients/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Users, PlusCircle } from 'lucide-react';
import { formatPhone } from '@/lib/phoneFormatter';

interface PatientData {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  birth_date?: string;
  medical_history?: string;
  created_at: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      try {
        console.log('[Page] Buscando pacientes de /api/patients');
        const res = await fetch('/api/patients');

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Page] Erro HTTP ${res.status}:`, errText);
          setPatients([]);
          return;
        }

        const json = await res.json();
        console.log('[Page] Resposta recebida:', json);
        setPatients(json.patients || []);
      } catch (err) {
        console.error('[Page] Erro ao buscar /api/patients:', err);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Tem certeza que deseja excluir este paciente? Esta ação não poderá ser desfeita.');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao excluir paciente: ' + (err.error || res.statusText));
        return;
      }
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir paciente: ' + (err.message || String(err)));
    }
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <Users className="w-8 h-8 mr-3 text-pink-500" />
          Gerenciamento de Pacientes
        </h2>
        <button
          onClick={() => router.push('/patients/new')}
          className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 transition duration-150"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Paciente
        </button>
      </header>

      <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-800">
        {loading && (
          <p className="text-pink-500 text-center py-8">Carregando dados dos pacientes...</p>
        )}

        {!loading && patients.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400">Nenhum paciente cadastrado ainda.</p>
            <button
              onClick={() => router.push('/patients/new')}
              className="mt-4 text-pink-500 hover:text-pink-400 transition"
            >
              Clique aqui para cadastrar o primeiro.
            </button>
          </div>
        )}

        {!loading && patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">CPF</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Telefone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Data de Nascimento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">{patient.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{patient.cpf || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatPhone(patient.phone) || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatDate(patient.birth_date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                      <button
                        onClick={() => router.push(`/patients/${patient.id}/edit`)}
                        className="text-pink-500 hover:text-pink-400 transition duration-150"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
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
