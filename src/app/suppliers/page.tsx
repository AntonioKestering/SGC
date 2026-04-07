'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Truck, PlusCircle, Edit, Trash2 } from 'lucide-react';

interface SupplierData {
  id: string;
  company_name: string;
  cnpj: string | null;
  contact_name: string | null;
  phone: string | null;
  created_at: string;
  organization_id: string;
}

export default function SuppliersIndexPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  // 1. FUNÇÃO PARA BUSCAR FORNECEDORES
  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/suppliers');
        const json = await response.json();
        
        if (!response.ok) {
          console.error('Erro ao carregar fornecedores:', json.error);
          setSuppliers([]);
        } else {
          setSuppliers(json.suppliers as SupplierData[]);
        }
      } catch (err) {
        console.error('Erro ao buscar fornecedores:', err);
        setSuppliers([]);
      }
      setLoading(false);
    }
    fetchSuppliers();
  }, []);

  // Função para excluir fornecedor com confirmação
  async function handleDelete(id: string, companyName: string) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${companyName}"? Esta ação não poderá ser desfeita.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const json = await response.json();
        alert('Erro ao excluir fornecedor: ' + json.error);
        return;
      }
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Erro ao excluir fornecedor:', err);
      alert('Erro ao excluir fornecedor');
    }
  }

  // 2. ESTRUTURA E ESTILO DA TELA
  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <Truck className="w-8 h-8 mr-3 text-pink-500" />
          Gerenciamento de Fornecedores
        </h2>
        
        {/* BOTÃO PARA NOVO CADASTRO */}
        <button
          onClick={() => router.push('/suppliers/new')}
          className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white 
                     bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-pink-500 focus:ring-offset-zinc-900 transition duration-150"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Fornecedor
        </button>
      </header>

      <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-800">
        {loading && (
          <p className="text-pink-500 text-center py-8">Carregando dados dos fornecedores...</p>
        )}
        
        {!loading && suppliers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400">Nenhum fornecedor cadastrado ainda.</p>
            <button
              onClick={() => router.push('/suppliers/new')}
              className="mt-4 text-pink-500 hover:text-pink-400 transition"
            >
              Clique aqui para cadastrar o primeiro.
            </button>
          </div>
        )}
        
        {!loading && suppliers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-800 text-zinc-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Empresa</th>
                  <th scope="col" className="px-6 py-3">CNPJ</th>
                  <th scope="col" className="px-6 py-3">Contato</th>
                  <th scope="col" className="px-6 py-3">Telefone</th>
                  <th scope="col" className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-zinc-700 hover:bg-zinc-800/50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-50">
                      {supplier.company_name}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.cnpj || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.contact_name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.company_name)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
