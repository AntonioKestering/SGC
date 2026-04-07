'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Truck, Save } from 'lucide-react';
import { formatPhone } from '@/lib/phoneFormatter';
import { formatCpfCnpj, isValidCpfOrCnpj, getCpfCnpjLabel } from '@/lib/cpfCnpjFormatter';

interface SupplierData {
  id: string;
  company_name: string;
  cnpj: string | null;
  contact_name: string | null;
  phone: string | null;
}

export default function EditSupplierPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const router = useRouter();

  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value);
    setCpfCnpj(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  // 1. CARREGAR DADOS EXISTENTES
  useEffect(() => {
    async function fetchSupplier() {
      if (!supplierId) return;

      try {
        const response = await fetch(`/api/suppliers/${supplierId}`);
        const json = await response.json();

        if (!response.ok) {
          setError('Fornecedor não encontrado');
          setLoading(false);
          return;
        }

        const supplier = json.supplier as SupplierData;
        setSupplierData(supplier);
        setCompanyName(supplier.company_name);
        setCpfCnpj(supplier.cnpj ? formatCpfCnpj(supplier.cnpj) : '');
        setContactName(supplier.contact_name || '');
        setPhone(supplier.phone ? formatPhone(supplier.phone) : '');
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar fornecedor:', err);
        setError('Erro ao carregar fornecedor');
        setLoading(false);
      }
    }

    fetchSupplier();
  }, [supplierId]);

  // 2. SUBMETER ALTERAÇÕES
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validação
    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      setIsSaving(false);
      return;
    }

    // Validar CPF/CNPJ se fornecido
    if (cpfCnpj.trim() && !isValidCpfOrCnpj(cpfCnpj)) {
      setError(`${getCpfCnpjLabel(cpfCnpj)} inválido`);
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PUT',
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
        setError(json.error || 'Erro ao atualizar fornecedor');
        setIsSaving(false);
        return;
      }

      // Sucesso - redirecionar para listagem
      router.push('/suppliers');
    } catch (err) {
      console.error('Erro ao atualizar fornecedor:', err);
      setError('Erro ao atualizar fornecedor');
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-pink-500">Carregando fornecedor...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !supplierData) {
    return (
      <DashboardLayout>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => router.push('/suppliers')}
            className="mt-4 text-pink-500 hover:text-pink-400 transition"
          >
            Voltar para Fornecedores
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <header className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-50 flex items-center justify-center">
              <Truck className="w-8 h-8 mr-3 text-pink-500" />
              Editar Fornecedor
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-6 justify-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/suppliers')}
                  disabled={isSaving}
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
