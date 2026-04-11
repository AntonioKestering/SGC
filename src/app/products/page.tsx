// src/app/products/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BatchDetailsModal } from '@/components/BatchDetailsModal';
import { Box, PlusCircle, Package } from 'lucide-react';

interface ProductData {
  id: string;
  supplier_id?: string | null;
  name: string;
  description?: string | null;
  barcode?: string | null;
  price?: string | null;
  price_sale?: string | null;
  created_at: string;
}

interface BatchInfo {
  id: string;
  product_id: string;
  quantity: number;
  current_quantity: number;
  cost_price: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchStocks, setBatchStocks] = useState<Record<string, number>>({});
  const [batchCostAverages, setBatchCostAverages] = useState<Record<string, number>>({});
  const [selectedBatchProduct, setSelectedBatchProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch('/api/products');
        if (!res.ok) {
          console.error('Erro ao buscar produtos', await res.text());
          setProducts([]);
          return;
        }
        const json = await res.json();
        setProducts(json.products || []);
        
        // Fetch batch stocks for all products
        await fetchBatchStocks(json.products || []);
      } catch (err) {
        console.error('Erro ao buscar /api/products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  async function fetchBatchStocks(products: ProductData[]) {
    const stocks: Record<string, number> = {};
    const averageCosts: Record<string, number> = {};
    
    for (const product of products) {
      try {
        const res = await fetch(`/api/product-batches?product_id=${product.id}`);
        if (res.ok) {
          const data = await res.json();
          const batches: BatchInfo[] = data.batches || [];
          
          // Calcula o saldo total de estoque
          stocks[product.id] = batches.reduce(
            (sum: number, b: any) => sum + b.current_quantity,
            0
          );
          
          // Calcula o preço de custo médio ponderado
          if (batches.length > 0) {
            const totalQuantity = batches.reduce((sum: number, b: any) => sum + b.current_quantity, 0);
            if (totalQuantity > 0) {
              const totalCost = batches.reduce((sum: number, b: any) => sum + (b.current_quantity * b.cost_price), 0);
              averageCosts[product.id] = totalCost / totalQuantity;
            } else {
              averageCosts[product.id] = 0;
            }
          } else {
            averageCosts[product.id] = 0;
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar lotes do produto ${product.id}:`, err);
      }
    }
    
    setBatchStocks(stocks);
    setBatchCostAverages(averageCosts);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Tem certeza que deseja excluir este produto? Esta ação não poderá ser desfeita.');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao excluir produto: ' + (err.error || res.statusText));
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir produto: ' + (err.message || String(err)));
    }
  }

  function formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    // If the stored value is a date-only string (YYYY-MM-DD), avoid creating
    // a Date object which may be interpreted in UTC and cause a timezone
    // shift (showing the previous day). Instead format directly from the
    // parts to preserve the exact date entered in the DB.
    const dateOnly = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateString);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      return `${day}/${month}/${year}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  function formatPrice(price?: string | number | null): string {
    if (price == null || price === '') return '-';
    try {
      const n = typeof price === 'number' ? price : Number(String(price).replace(',', '.'));
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return String(price);
    }
  }

  function computeProfitPercent(price?: string | number | null, priceSale?: string | number | null): string {
    if (price == null || price === '' ) return '-';
    if (priceSale == null || priceSale === '') return '-';
    try {
      const p = typeof price === 'number' ? price : Number(String(price).replace(',', '.'));
      const ps = typeof priceSale === 'number' ? priceSale : Number(String(priceSale).replace(',', '.'));
      if (!p || p === 0) return '-';
      const perc = ((ps - p) / p) * 100;
      return perc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    } catch {
      return '-';
    }
  }

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <Box className="w-8 h-8 mr-3 text-pink-500" />
          Gerenciamento de Produtos
        </h2>
        <button
          onClick={() => router.push('/products/new')}
          className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 transition duration-150"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Produto
        </button>
      </header>

      <BatchDetailsModal
        isOpen={!!selectedBatchProduct}
        productId={selectedBatchProduct?.id || ''}
        productName={selectedBatchProduct?.name || ''}
        onClose={() => setSelectedBatchProduct(null)}
      />

      <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-800">
        {loading && (
          <p className="text-pink-500 text-center py-8">Carregando produtos...</p>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400">Nenhum produto cadastrado ainda.</p>
            <button
              onClick={() => router.push('/products/new')}
              className="mt-4 text-pink-500 hover:text-pink-400 transition"
            >
              Clique aqui para cadastrar o primeiro.
            </button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Cod. Barras</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Saldo de Estoque</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço de Compra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço de Venda</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Lucro (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((p) => {
                  const totalBatchStock = batchStocks[p.id] || 0;
                  const avgCostPrice = batchCostAverages[p.id] ?? 0;
                  
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{p.barcode}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">{p.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-300 font-semibold">{totalBatchStock}</span>
                          {totalBatchStock > 0 && (
                            <button
                              onClick={() => setSelectedBatchProduct({ id: p.id, name: p.name })}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 rounded transition"
                              title="Ver lotes"
                            >
                              <Package className="w-3 h-3" />
                              Lotes
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
                        {totalBatchStock > 0 ? formatPrice(avgCostPrice) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatPrice(p.price_sale)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {totalBatchStock > 0 ? computeProfitPercent(avgCostPrice, p.price_sale) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                        <button
                          onClick={() => router.push(`/products/${p.id}/edit`)}
                          className="text-pink-500 hover:text-pink-400 transition duration-150"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-pink-500 hover:text-red-400 transition duration-150"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
