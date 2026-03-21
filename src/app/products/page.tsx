// src/app/products/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Box, PlusCircle } from 'lucide-react';

interface ProductData {
  id: string;
  supplier_id?: string | null;
  name: string;
  description?: string | null;
  barcode?: string | null;
  stock_quantity: number;
  expiry_date?: string | null;
    price?: string | null;
    price_sale?: string | null;
  created_at: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Erro ao buscar /api/products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Estoque</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Validade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço de Compra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço de Venda</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Lucro (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">{p.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{p.stock_quantity ?? 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatDate(p.expiry_date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatPrice(p.price)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{formatPrice(p.price_sale)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">{computeProfitPercent(p.price, p.price_sale)}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
