'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Truck, Save } from 'lucide-react';
import { formatPhone } from '@/lib/phoneFormatter';
import { formatCpfCnpj, isValidCpfOrCnpj, getCpfCnpjLabel } from '@/lib/cpfCnpjFormatter';

export default function NewSupplierPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value);
    setCpfCnpj(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

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

    // Validar CPF/CNPJ se fornecido
    if (cpfCnpj.trim() && !isValidCpfOrCnpj(cpfCnpj)) {
      setError(`${getCpfCnpjLabel(cpfCnpj)} inválido`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          cnpj: cpfCnpj.trim() || null,
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
      <div className="flex flex-col items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <header className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-50 flex items-center justify-center">
              <Truck className="w-8 h-8 mr-3 text-pink-500" />
              Novo Fornecedor
            </h2>
          </header>

          <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
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

              {/* Campo: CPF/CNPJ */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {getCpfCnpjLabel(cpfCnpj)} {cpfCnpj ? '' : '(CPF ou CNPJ)'}
                </label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={handleCpfCnpjChange}
                  placeholder="CPF: XXX.XXX.XXX-XX | CNPJ: XX.XXX.XXX/XXXX-XX"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  disabled={loading}
                />
                {cpfCnpj && !isValidCpfOrCnpj(cpfCnpj) && (
                  <p className="text-red-400 text-xs mt-1">{getCpfCnpjLabel(cpfCnpj)} inválido</p>
                )}
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
                  onChange={handlePhoneChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  disabled={loading}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-6 justify-center">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
