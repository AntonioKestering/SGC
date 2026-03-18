// src/app/appointments/new/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Save } from 'lucide-react';

interface Specialist {
  id: string;
  full_name: string;
  specialty: string;
}

interface Patient {
  id: string;
  full_name: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [formData, setFormData] = useState({
    specialist_id: '',
    patient_id: '',
    start_time: '',
    end_time: '',
    status: 'agendado',
    notes: '',
  });

  // Buscar especialistas e pacientes
  useEffect(() => {
    async function fetchData() {
      try {
        const [specRes, patRes] = await Promise.all([
          fetch('/api/specialists'),
          fetch('/api/patients'),
        ]);

        if (specRes.ok) {
          const { specialists } = await specRes.json();
          setSpecialists(specialists || []);
        }

        if (patRes.ok) {
          const { patients } = await patRes.json();
          setPatients(patients || []);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    }

    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.specialist_id || !formData.patient_id || !formData.start_time || !formData.end_time) {
        setError('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);

      if (endTime <= startTime) {
        setError('A hora de término deve ser após a hora de início');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao criar agendamento');
      }

      router.push('/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-pink-500 hover:text-pink-400 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>

        <h2 className="text-3xl font-semibold text-zinc-50 mb-6">Novo Agendamento</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 space-y-6">
          {/* Especialista */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Especialista <span className="text-pink-500">*</span>
            </label>
            <select
              name="specialist_id"
              value={formData.specialist_id}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            >
              <option value="">Selecione um especialista</option>
              {specialists.map(spec => (
                <option key={spec.id} value={spec.id}>
                  {spec.full_name} - {spec.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Paciente */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Paciente <span className="text-pink-500">*</span>
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            >
              <option value="">Selecione um paciente</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Data/Hora de Início */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Data/Hora de Início <span className="text-pink-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Data/Hora de Término */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Data/Hora de Término <span className="text-pink-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            >
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
              <option value="falta">Falta</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Notas</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Adicione observações sobre o agendamento..."
              rows={4}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-2 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center px-6 py-2 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
