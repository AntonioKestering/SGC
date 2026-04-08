// src/app/products/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlusCircle, Save, ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    stock_quantity: 0,
    expiry_date: '',
    price: '',
    price_sale: '',
    supplier_id: '',
  });
  const [profitPercent, setProfitPercent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function computeProfitPercentFromStrings(priceStr: string, priceSaleStr: string): string {
    if (!priceStr || priceStr === '') return '-';
    if (!priceSaleStr || priceSaleStr === '') return '-';
    try {
      const p = Number(String(priceStr).replace(',', '.'));
      const ps = Number(String(priceSaleStr).replace(',', '.'));
      if (!p || p === 0) return '-';
      const perc = ((ps - p) / p) * 100;
      return perc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    } catch {
      return '-';
    }
  }

  function handleProfitPercentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setProfitPercent(v);
    // recalcula priceSale se tivermos price válido
    const priceNum = Number(String(formData.price).replace(',', '.'));
    const percNum = Number(String(v).replace(',', '.'));
    if (!isNaN(priceNum) && priceNum > 0 && !isNaN(percNum)) {
      const newPriceSale = priceNum * (1 + percNum / 100);
      setFormData({ ...formData, price_sale: String(Number(newPriceSale.toFixed(2))) });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Nome do produto é obrigatório.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: formData.supplier_id || null,
          name: formData.name,
          description: formData.description || null,
          barcode: formData.barcode || null,
          stock_quantity: Number(formData.stock_quantity) || 0,
          expiry_date: formData.expiry_date || null,
          price: formData.price !== '' ? Number(String(formData.price).replace(',', '.')) : null,
          price_sale: formData.price_sale !== '' ? Number(String(formData.price_sale).replace(',', '.')) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar produto');
      }

      setSuccess(true);
      setFormData({ name: '', description: '', barcode: '', stock_quantity: 0, expiry_date: '', price: '', price_sale: '', supplier_id: '' });

      setTimeout(() => router.push('/products'), 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
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
            Novo Produto
          </h2>
        </div>

        {success && (
          <div className="bg-green-900 p-4 rounded-lg text-green-200 mb-6 border border-green-700">✓ Produto cadastrado com sucesso! Redirecionando...</div>
        )}

        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">✕ {error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-200 mb-1">Nome *</label>
            <input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-200 mb-1">Descrição</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-zinc-200 mb-1">Código de Barras</label>
              <input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-zinc-200 mb-1">Quantidade em Estoque</label>
              <input
                id="stock_quantity"
                type="number"
                min={0}
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-zinc-200 mb-1">Validade</label>
              <input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-zinc-200 mb-1">Preço de Compra</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="price_sale" className="block text-sm font-medium text-zinc-200 mb-1">Preço de Venda</label>
              <input
                id="price_sale"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_sale}
                onChange={(e) => {
                  setFormData({ ...formData, price_sale: e.target.value });
                  // atualizar percentual quando o usuário editar price_sale diretamente
                  const pNum = Number(String(formData.price).replace(',', '.'));
                  const psNum = Number(String(e.target.value).replace(',', '.'));
                  if (!isNaN(pNum) && pNum > 0 && !isNaN(psNum)) {
                    const perc = ((psNum - pNum) / pNum) * 100;
                    setProfitPercent(String(Number(perc.toFixed(2))));
                  } else {
                    setProfitPercent('');
                  }
                }}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="text-sm text-zinc-300">
              <strong>Lucro (%):</strong> {computeProfitPercentFromStrings(formData.price, formData.price_sale)}
            </div>
            <div>
              <label htmlFor="profit_percent" className="block text-sm font-medium text-zinc-200 mb-1">Editar Percentual de Lucro (%)</label>
              <input
                id="profit_percent"
                type="number"
                step="0.01"
                value={profitPercent}
                onChange={handleProfitPercentChange}
                placeholder="0.00"
                className="w-48 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>
          </div>

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
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
