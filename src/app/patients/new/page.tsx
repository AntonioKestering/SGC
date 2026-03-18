// src/app/patients/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlusCircle, ArrowLeft } from 'lucide-react';

export default function NewPatientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    phone: '',
    birth_date: '',
    medical_history: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.full_name.trim()) {
      setError('Nome do paciente é obrigatório.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          cpf: formData.cpf || null,
          phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          birth_date: formData.birth_date || null,
          medical_history: formData.medical_history || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar paciente');
      }

      setSuccess(true);
      setFormData({
        full_name: '',
        cpf: '',
        phone: '',
        birth_date: '',
        medical_history: '',
      });

      setTimeout(() => {
        router.push('/patients');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar paciente');
    } finally {
      setLoading(false);
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
            <PlusCircle className="w-8 h-8 mr-3 text-pink-500" />
            Novo Paciente
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
          {success && (
            <div className="bg-green-900 p-4 rounded-lg text-green-200 border border-green-700">
              ✓ Paciente cadastrado com sucesso! Redirecionando...
            </div>
          )}

          {error && (
            <div className="bg-red-900 p-4 rounded-lg text-red-200 border border-red-700">
              ✕ {error}
            </div>
          )}

          {/* NOME COMPLETO */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-zinc-200 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="João da Silva"
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
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: formatCPFInput(e.target.value) })}
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
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
              placeholder="(11) 99999-9999"
              maxLength={15}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* DATA DE NASCIMENTO */}
          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-zinc-200 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birth_date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* HISTÓRICO MÉDICO */}
          <div>
            <label htmlFor="medical_history" className="block text-sm font-medium text-zinc-200 mb-1">
              Histórico Médico
            </label>
            <textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              placeholder="Anotações sobre alergias, procedimentos anteriores, etc."
              rows={5}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          {/* BOTÕES */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 focus:ring-offset-zinc-900 transition duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
