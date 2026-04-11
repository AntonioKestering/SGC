// src/components/BatchDetailsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Batch {
  id: string;
  batch_number?: string | null;
  expiry_date: string;
  initial_quantity: number;
  current_quantity: number;
  cost_price?: number | null;
  created_at: string;
}

interface BatchDetailsModalProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
}

export function BatchDetailsModal({
  isOpen,
  productId,
  productName,
  onClose,
}: BatchDetailsModalProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchBatches();
    }
  }, [isOpen, productId]);

  async function fetchBatches() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/product-batches?product_id=${productId}`);
      if (!res.ok) {
        setError('Erro ao carregar lotes');
        return;
      }
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (err) {
      setError('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  }

  const totalStock = batches.reduce((sum, b) => sum + b.current_quantity, 0);
  const totalInitial = batches.reduce((sum, b) => sum + b.initial_quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-2xl border border-zinc-800 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Lotes - {productName}</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Total em estoque: <span className="font-semibold text-pink-400">{totalStock} unidades</span>
            </p>
          </div>
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

        {loading ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">Carregando lotes...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">Nenhum lote cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const expiryDate = new Date(batch.expiry_date);
              const today = new Date();
              const isExpired = expiryDate < today;
              const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={batch.id}
                  className={`p-4 rounded-lg border ${
                    isExpired
                      ? 'bg-red-500/5 border-red-500/30'
                      : daysToExpiry <= 30
                      ? 'bg-yellow-500/5 border-yellow-500/30'
                      : 'bg-zinc-800/50 border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {batch.batch_number && (
                        <p className="text-sm font-medium text-zinc-300">
                          Lote: <span className="text-zinc-200">{batch.batch_number}</span>
                        </p>
                      )}
                      <p className="text-sm text-zinc-400">
                        Validade: <span className={isExpired ? 'text-red-400 font-semibold' : 'text-zinc-300'}>
                          {expiryDate.toLocaleDateString('pt-BR')}
                        </span>
                        {!isExpired && daysToExpiry <= 30 && (
                          <span className="text-yellow-400 ml-2">({daysToExpiry} dias)</span>
                        )}
                        {isExpired && <span className="text-red-400 ml-2">(Vencido)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-100">{batch.current_quantity}</p>
                      <p className="text-xs text-zinc-500">
                        {batch.current_quantity}/{batch.initial_quantity} unidades
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {batch.cost_price && (
                      <div>
                        <p className="text-zinc-500">Custo Unitário</p>
                        <p className="text-zinc-300">
                          R$ {(batch.cost_price).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-zinc-500">Entrada</p>
                      <p className="text-zinc-300">
                        {new Date(batch.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3 bg-zinc-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isExpired ? 'bg-red-500' : daysToExpiry <= 30 ? 'bg-yellow-500' : 'bg-pink-500'
                      }`}
                      style={{ width: `${(batch.current_quantity / batch.initial_quantity) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resumo */}
        <div className="mt-6 pt-4 border-t border-zinc-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Total Lotes</p>
              <p className="text-lg font-semibold text-zinc-100">{batches.length}</p>
            </div>
            <div>
              <p className="text-zinc-500">Entrada Total</p>
              <p className="text-lg font-semibold text-zinc-100">{totalInitial}</p>
            </div>
            <div>
              <p className="text-zinc-500">Em Estoque</p>
              <p className="text-lg font-semibold text-pink-400">{totalStock}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
