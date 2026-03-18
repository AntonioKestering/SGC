// src/app/appointments/[id]/edit/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { convertToDatetimeLocal } from '@/lib/dateTimeFormatter';

interface Specialist {
  id: string;
  full_name: string;
  specialty: string;
}

interface Patient {
  id: string;
  full_name: string;
}

interface Appointment {
  id: string;
  specialist: Specialist;
  patient: Patient;
  start_time: string;
  end_time: string;
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'falta';
  notes?: string;
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [formData, setFormData] = useState<Appointment | null>(null);
  const [editData, setEditData] = useState({
    specialist_id: '',
    patient_id: '',
    start_time: '',
    end_time: '',
    status: 'agendado' as const,
    notes: '',
  });

  // Converter ISO string para formato datetime-local
  function convertToDatetimeLocal(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [aptRes, specRes, patRes] = await Promise.all([
          fetch(`/api/appointments/${appointmentId}`),
          fetch('/api/specialists'),
          fetch('/api/patients'),
        ]);

        if (!aptRes.ok) throw new Error('Agendamento não encontrado');

        const { appointment } = await aptRes.json();
        setFormData(appointment);
        setEditData({
          specialist_id: appointment.specialist.id,
          patient_id: appointment.patient.id,
          start_time: convertToDatetimeLocal(appointment.start_time),
          end_time: convertToDatetimeLocal(appointment.end_time),
          status: appointment.status,
          notes: appointment.notes || '',
        });

        if (specRes.ok) {
          const { specialists } = await specRes.json();
          setSpecialists(specialists || []);
        }

        if (patRes.ok) {
          const { patients } = await patRes.json();
          setPatients(patients || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [appointmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!editData.specialist_id || !editData.patient_id || !editData.start_time || !editData.end_time) {
        setError('Preencha todos os campos obrigatórios');
        setSaving(false);
        return;
      }

      const startTime = new Date(editData.start_time);
      const endTime = new Date(editData.end_time);

      if (endTime <= startTime) {
        setError('A hora de término deve ser após a hora de início');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao atualizar agendamento');
      }

      router.push('/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja deletar este agendamento?')) return;

    setError('');
    setDeleting(true);

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao deletar agendamento');

      router.push('/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setDeleting(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-pink-500">Carregando agendamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!formData) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-400">Agendamento não encontrado</div>
      </DashboardLayout>
    );
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

        <h2 className="text-3xl font-semibold text-zinc-50 mb-6">Editar Agendamento</h2>

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
              value={editData.specialist_id}
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
              value={editData.patient_id}
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
              value={editData.start_time}
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
              value={editData.end_time}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
            <select
              name="status"
              value={editData.status}
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
              value={editData.notes}
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
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center px-6 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-600 font-medium hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {deleting ? 'Deletando...' : 'Deletar'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-2 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center px-6 py-2 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
