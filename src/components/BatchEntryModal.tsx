// src/components/BatchEntryModal.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface BatchEntryModalProps {
  isOpen: boolean;
  productId: string;
  onClose: () => void;
  onSubmit: (data: BatchEntryData) => Promise<void>;
  isLoading?: boolean;
}

export interface BatchEntryData {
  batch_number: string;
  expiry_date: string;
  initial_quantity: number;
  cost_price: number | null;
}

export function BatchEntryModal({
  isOpen,
  productId,
  onClose,
  onSubmit,
  isLoading = false,
}: BatchEntryModalProps) {
  const [formData, setFormData] = useState<BatchEntryData>({
    batch_number: '',
    expiry_date: '',
    initial_quantity: 0,
    cost_price: null,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.expiry_date) {
      setError('Data de validade é obrigatória');
      return;
    }

    if (formData.initial_quantity <= 0) {
      setError('Quantidade deve ser maior que 0');
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        batch_number: '',
        expiry_date: '',
        initial_quantity: 0,
        cost_price: null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar lote');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-100">Entrada de Estoque</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Número do Lote (Batch) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Número do Lote (Opcional)
            </label>
            <input
              type="text"
              value={formData.batch_number}
              onChange={(e) =>
                setFormData({ ...formData, batch_number: e.target.value })
              }
              placeholder="Ex: BATCH-2024-001"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>

          {/* Data de Validade */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Data de Validade *
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) =>
                setFormData({ ...formData, expiry_date: e.target.value })
              }
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Quantidade *
            </label>
            <input
              type="number"
              min="1"
              value={formData.initial_quantity || ''}
              onChange={(e) =>
                setFormData({ ...formData, initial_quantity: Number(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>

          {/* Custo */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Custo Unitário (R$) (Opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price || ''}
              onChange={(e) =>
                setFormData({ ...formData, cost_price: Number(e.target.value) || null })
              }
              placeholder="0,00"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {isLoading ? 'Adicionando...' : 'Adicionar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
