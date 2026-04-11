// src/app/products/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BatchEntryModal } from '@/components/BatchEntryModal';
import { PlusCircle, Save, ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    price_sale: '',
    supplier_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  // Função para formatar como moeda (0.000,00)
  function formatCurrency(value: string): string {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Converte para número e divide por 100 (centavos)
    const numberValue = parseInt(numericValue) / 100;
    
    // Formata como moeda brasileira
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function handlePriceSaleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value);
    setFormData({ ...formData, price_sale: formatted });
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
          price_sale: formData.price_sale !== '' ? Number(String(formData.price_sale).replace(/\D/g, '')) / 100 : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar produto');
      }

      const { product } = await res.json();
      setCreatedProductId(product.id);
      setSuccess(true);
      setShowBatchModal(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {createdProductId && (
          <BatchEntryModal
            isOpen={showBatchModal}
            productId={createdProductId}
            productName={formData.name}
            onClose={() => {
              setShowBatchModal(false);
              setTimeout(() => router.push('/products'), 500);
            }}
            onSuccess={() => {
              setShowBatchModal(false);
              setTimeout(() => router.push('/products'), 500);
            }}
          />
        )}

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
          <div className="bg-green-900 p-4 rounded-lg text-green-200 mb-6 border border-green-700">✓ Produto cadastrado com sucesso! Adicione lotes abaixo.</div>
        )}

        {error && (
          <div className="bg-red-900 p-4 rounded-lg text-red-200 mb-6 border border-red-700">✕ {error}</div>
        )}

        {!success ? (
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

          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-zinc-200 mb-1">Código de Barras</label>
            <input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price_sale" className="block text-sm font-medium text-zinc-200 mb-1">Preço de Venda</label>
              <input
                id="price_sale"
                type="text"
                inputMode="decimal"
                value={formData.price_sale}
                onChange={handlePriceSaleChange}
                placeholder="0.000,00"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150"
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
        ) : (
          <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800 text-center">
            <p className="text-zinc-300 mb-4">Para adicionar lotes de estoque, use o formulário abaixo.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
