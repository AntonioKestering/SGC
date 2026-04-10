// src/app/sales/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingCart, Eye, ArrowLeft } from 'lucide-react';

interface SaleItemData {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number | null;
  tax_percent?: number | null;
  total_price: number;
  product?: {
    id: string;
    name: string;
    barcode?: string | null;
  };
}

interface SaleData {
  id: string;
  patient_id?: string | null;
  patient?: { id: string; full_name: string } | null;
  total_amount: number;
  subtotal: number;
  discount_amount?: number | null;
  tax_amount?: number | null;
  sale_date: string;
  status: number;
  payment_method?: number | null;
  notes?: string | null;
  sale_items?: SaleItemData[];
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

export default function ViewSalePage() {
  const params = useParams();
  const saleId = params.id as string;
  const router = useRouter();

  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSale() {
      if (!saleId) return;

      try {
        const response = await fetch(`/api/sales/${saleId}`);
        const json = await response.json();

        if (!response.ok) {
          setError('Venda não encontrada');
          setLoading(false);
          return;
        }

        setSaleData(json.sale);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar venda:', err);
        setError('Erro ao carregar venda');
        setLoading(false);
      }
    }

    fetchSale();
  }, [saleId]);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatCurrency(amount: number | null | undefined): string {
    return (amount || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-pink-500">Carregando venda...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !saleData) {
    return (
      <DashboardLayout>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error || 'Erro ao carregar venda'}</p>
          <button
            onClick={() => router.push('/sales')}
            className="mt-4 text-pink-500 hover:text-pink-400 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Vendas
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = STATUS_LABELS[String(saleData.status)];
  const paymentLabel =
    PAYMENT_METHOD_LABELS[String(saleData.payment_method ?? -1)] || '-';

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => router.push('/sales')}
            className="mb-6 text-pink-500 hover:text-pink-400 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Vendas
          </button>

          <header className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-50 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 mr-3 text-pink-500" />
              Detalhes da Venda
            </h2>
          </header>

          <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800 space-y-8">
            {/* Informações Principais */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Data da Venda
                </p>
                <p className="text-lg text-zinc-100 font-medium">
                  {formatDate(saleData.sale_date)}
                </p>
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                      statusInfo?.color || 'bg-zinc-700 border-zinc-600 text-zinc-300'
                    }`}
                  >
                    {statusInfo?.label || 'Desconhecido'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Cliente
                </p>
                <p className="text-lg text-zinc-100 font-medium">
                  {saleData.patient?.full_name || 'Venda Avulsa'}
                </p>
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                  Método de Pagamento
                </p>
                <p className="text-lg text-zinc-100 font-medium">{paymentLabel}</p>
              </div>
            </div>

            {/* Itens da Venda */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Itens da Venda</h3>

              {saleData.sale_items && saleData.sale_items.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-zinc-700">
                  <table className="w-full">
                    <thead className="bg-zinc-800 border-b border-zinc-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                          Produto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 w-16">
                          Qtd
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 w-24">
                          Unitário
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 w-24">
                          Desconto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 w-16">
                          Imposto %
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 w-28">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.sale_items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-zinc-700 hover:bg-zinc-800/50 transition"
                        >
                          <td className="px-4 py-3">
                            <div className="text-zinc-100 font-medium">
                              {item.product?.name}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Código: {item.product?.barcode || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-100">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-100">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-100">
                            {formatCurrency(item.discount_amount)}
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-100">
                            {item.tax_percent}%
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-zinc-100">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-zinc-800/50 rounded-lg p-6 text-center border border-dashed border-zinc-700">
                  <p className="text-zinc-400">Nenhum item nesta venda.</p>
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 space-y-3">
              <div className="flex justify-between text-zinc-300">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(saleData.subtotal)}</span>
              </div>
              {(saleData.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Desconto:</span>
                  <span className="font-semibold">
                    -{formatCurrency(saleData.discount_amount)}
                  </span>
                </div>
              )}
              {(saleData.tax_amount || 0) > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>Impostos:</span>
                  <span className="font-semibold">+{formatCurrency(saleData.tax_amount)}</span>
                </div>
              )}
              <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg font-bold text-pink-400">
                <span>Total:</span>
                <span>{formatCurrency(saleData.total_amount)}</span>
              </div>
            </div>

            {/* Observações */}
            {saleData.notes && (
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">
                  Observações
                </p>
                <p className="text-zinc-100 whitespace-pre-wrap">{saleData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
