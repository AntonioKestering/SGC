'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Truck, Save } from 'lucide-react';

export default function NewSupplierPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação
    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          cnpj: cnpj.trim() || null,
          contact_name: contactName.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Erro ao criar fornecedor');
        setLoading(false);
        return;
      }

      // Sucesso - redirecionar para listagem
      router.push('/suppliers');
    } catch (err) {
      console.error('Erro ao criar fornecedor:', err);
      setError('Erro ao criar fornecedor');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <Truck className="w-8 h-8 mr-3 text-pink-500" />
          Novo Fornecedor
        </h2>
      </header>

      <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo: Nome da Empresa */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Nome da Empresa *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Fornecedora de Produtos Estéticos Ltda"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              disabled={loading}
            />
          </div>

          {/* Campo: CNPJ */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              CNPJ
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="XX.XXX.XXX/XXXX-XX"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              disabled={loading}
            />
          </div>

          {/* Campo: Nome do Contato */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Contato (Nome)
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              disabled={loading}
            />
          </div>

          {/* Campo: Telefone */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              disabled={loading}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/suppliers')}
              disabled={loading}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-lg font-medium transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
