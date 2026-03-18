// src/app/patients/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserCog, Save, ArrowLeft } from 'lucide-react';

interface PatientProfile {
  id: string;
  full_name: string;
  cpf?: string;
  phone?: string;
  birth_date?: string;
  medical_history?: string;
  created_at: string;
}

export default function EditPatientPage() {
  const params = useParams();
  const patientId = params.id as string;
  const router = useRouter();

  const [patientData, setPatientData] = useState<PatientProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carregar dados do paciente
  useEffect(() => {
    async function fetchPatient() {
      if (!patientId) return;

      try {
        const res = await fetch(`/api/patients/${patientId}`);
        if (!res.ok) {
          throw new Error('Paciente não encontrado');
        }

        const { patient } = await res.json();
        setPatientData(patient);
        setFullName(patient.full_name || '');
        setCpf(patient.cpf || '');
        setPhone(patient.phone || '');
        setBirthDate(patient.birth_date || '');
        setMedicalHistory(patient.medical_history || '');
      } catch (err: any) {
        console.error('Erro ao carregar paciente:', err);
        setError('Paciente não encontrado ou erro de carregamento.');
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [patientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Nome do paciente é obrigatório.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          cpf: cpf || null,
          phone: phone ? phone.replace(/\D/g, '') : null,
          birth_date: birthDate || null,
          medical_history: medicalHistory || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar paciente');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/patients');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar paciente');
    } finally {
      setSaving(false);
    }
  }

  function formatPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function formatCPFInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-pink-500 text-center py-10">Carregando dados para edição...</div>
      </DashboardLayout>
    );
  }

  if (!patientData) {
    return (
      <DashboardLayout>
        <div className="text-red-500 text-center py-10">
          {error || 'Não foi possível carregar o paciente.'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-zinc-400" />
          </button>
          <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
            <UserCog className="w-8 h-8 mr-3 text-pink-500" />
            Editar Paciente: {patientData.full_name}
          </h2>
        </div>

        {success && (
          <div className="bg-green-900 p-4 rounded-lg text-green-200 mb-6 border border-green-700">
            ✓ Paciente atualizado com sucesso! Redirecionando...
          </div>
        )}

        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
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
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-zinc-200 mb-1">
              CPF
            </label>
            <input
              type="text"
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(formatCPFInput(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
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
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* DATA DE NASCIMENTO */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-zinc-200 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birthDate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* HISTÓRICO MÉDICO */}
          <div>
            <label htmlFor="medicalHistory" className="block text-sm font-medium text-zinc-200 mb-1">
              Histórico Médico
            </label>
            <textarea
              id="medicalHistory"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Anotações sobre alergias, procedimentos anteriores, etc."
              rows={5}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* BOTÕES */}
          <div className="flex gap-4 pt-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 focus:ring-offset-zinc-900 transition duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
