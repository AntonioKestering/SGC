// src/app/products/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Edit3, Save, ArrowLeft } from 'lucide-react';

interface ProductProfile {
  id: string;
  supplier_id?: string | null;
  name: string;
  description?: string | null;
  barcode?: string | null;
  stock_quantity: number;
  expiry_date?: string | null;
  price?: string | null;
  created_at: string;
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [productData, setProductData] = useState<ProductProfile | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [price, setPrice] = useState('');
  const [priceSale, setPriceSale] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Produto não encontrado');
        const { product } = await res.json();
        setProductData(product);
        setName(product.name || '');
        setDescription(product.description || '');
        setBarcode(product.barcode || '');
        setStockQuantity(product.stock_quantity ?? 0);
        setExpiryDate(product.expiry_date || '');
        setPrice(product.price || '');
        setPriceSale(product.price_sale || '');
      } catch (err: any) {
        console.error('Erro ao carregar produto:', err);
        setError('Produto não encontrado ou erro de carregamento.');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Nome do produto é obrigatório.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          barcode: barcode || null,
          stock_quantity: Number(stockQuantity) || 0,
          expiry_date: expiryDate || null,
          price: price || null,
          price_sale: priceSale || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar produto');
      }

      setSuccess(true);
      setTimeout(() => router.push('/products'), 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-pink-500 text-center py-10">Carregando dados do produto...</div>
      </DashboardLayout>
    );
  }

  if (!productData) {
    return (
      <DashboardLayout>
        <div className="text-red-500 text-center py-10">{error || 'Não foi possível carregar o produto.'}</div>
      </DashboardLayout>
    );
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
            <Edit3 className="w-8 h-8 mr-3 text-pink-500" />
            Editar Produto: {productData.name}
          </h2>
        </div>

        {success && (
          <div className="bg-green-900 p-4 rounded-lg text-green-200 mb-6 border border-green-700">✓ Produto atualizado com sucesso! Redirecionando...</div>
        )}

        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">✕ {error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-200 mb-1">Nome *</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-200 mb-1">Descrição</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-zinc-200 mb-1">Código de Barras</label>
              <input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-zinc-200 mb-1">Quantidade em Estoque</label>
              <input
                id="stock_quantity"
                type="number"
                min={0}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>

            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-zinc-200 mb-1">Validade</label>
              <input
                id="expiry_date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
              />
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-zinc-200 mb-1">Preço</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
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
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
