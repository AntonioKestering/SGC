// src/app/sales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingCart, PlusCircle, Eye, X, RotateCcw } from 'lucide-react';

interface SaleData {
  id: string;
  patient_id?: string | null;
  patient?: { id: string; full_name: string } | null;
  total_amount: number;
  sale_date: string;
  status: number; // -1 cancelada, 0 pendente, 1 finalizada
  payment_method?: number | null; // 0 dinheiro, 1 pix, 2 crediário, 3 débito, 4 crédito
  notes?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  '-1': { label: 'Cancelada', color: 'bg-red-500/10 border-red-500/30 text-red-400' },
  '0': { label: 'Pendente', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  '1': { label: 'Finalizada', color: 'bg-green-500/10 border-green-500/30 text-green-400' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  '0': 'Dinheiro',
  '1': 'PIX',
  '2': 'Crediário',
  '3': 'Débito',
  '4': 'Crédito',
};

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<SaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      try {
        const res = await fetch('/api/sales');
        if (!res.ok) {
          console.error('Erro ao buscar vendas', await res.text());
          setSales([]);
          return;
        }
        const json = await res.json();
        setSales(json.sales || []);
      } catch (err) {
        console.error('Erro ao buscar /api/sales:', err);
        setSales([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSales();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/sales');
      if (!res.ok) {
        console.error('Erro ao buscar vendas', await res.text());
        setSales([]);
        return;
      }
      const json = await res.json();
      setSales(json.sales || []);
    } catch (err) {
      console.error('Erro ao buscar /api/sales:', err);
      setSales([]);
    } finally {
      setRefreshing(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `${datePart} - ${timePart}`;
  }

  function formatCurrency(amount: number): string {
    return (amount || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function handleCancel(id: string) {
    const confirmed = window.confirm('Tem certeza que deseja cancelar esta venda?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao cancelar venda: ' + (err.error || res.statusText));
        return;
      }
      setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: -1 } : s)));
    } catch (err: any) {
      alert('Erro ao cancelar venda: ' + (err.message || String(err)));
    }
  }

  const filteredSales =
    statusFilter === 'all' ? sales : sales.filter((s) => s.status === statusFilter);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-pink-500">Carregando vendas...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center mb-6">
          <ShoppingCart className="w-8 h-8 mr-3 text-pink-500" />
          Vendas
        </h2>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {['all', -1, 0, 1].map((status) => (
            <button
              key={String(status)}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === status
                  ? 'bg-pink-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {status === 'all'
                ? 'Todas'
                : STATUS_LABELS[String(status as number)]?.label || 'Desconhecido'}
            </button>
          ))}
        </div>
      </header>

      {/* Botão Nova Venda */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => router.push('/sales/new')}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition"
        >
          <PlusCircle className="w-5 h-5" />
          + Nova Venda
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Recarregar vendas"
        >
          <RotateCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recarregando...' : 'Recarregar'}
        </button>
      </div>

      {/* Tabela de Vendas */}
      {filteredSales.length === 0 ? (
        <div className="bg-zinc-900 p-12 rounded-xl text-center border border-zinc-800">
          <ShoppingCart className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">
            {sales.length === 0 ? 'Nenhuma venda registrada' : 'Nenhuma venda neste filtro'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 shadow-xl">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-400 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const statusInfo = STATUS_LABELS[String(sale.status)];
                const paymentLabel = PAYMENT_METHOD_LABELS[String(sale.payment_method ?? -1)] || '-';

                return (
                  <tr key={sale.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4 text-zinc-100">{formatDate(sale.sale_date)}</td>
                    <td className="px-6 py-4 text-zinc-100">
                      {sale.patient?.full_name || 'Venda Avulsa'}
                    </td>
                    <td className="px-6 py-4 text-zinc-100">{paymentLabel}</td>
                    <td className="px-6 py-4 text-right text-zinc-100 font-semibold">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                          statusInfo?.color || 'bg-zinc-700 border-zinc-600 text-zinc-300'
                        }`}
                      >
                        {statusInfo?.label || 'Desconhecido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/sales/${sale.id}`)}
                          className="text-pink-500 hover:text-pink-400 transition p-2 hover:bg-zinc-700/50 rounded-lg"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status !== -1 && (
                          <button
                            onClick={() => handleCancel(sale.id)}
                            className="text-red-500 hover:text-red-400 transition p-2 hover:bg-zinc-700/50 rounded-lg"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
