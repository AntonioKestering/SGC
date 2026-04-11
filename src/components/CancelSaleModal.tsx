// src/components/CancelSaleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  batch_id?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    price?: number;
  };
  batch?: {
    id: string;
    batch_number: string;
    expiry_date: string;
  };
}

interface CancelSaleModalProps {
  saleId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  loading?: boolean;
  error?: string;
}

export function CancelSaleModal({
  saleId,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error,
}: CancelSaleModalProps) {
  const [saleData, setSaleData] = useState<any>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Buscar detalhes da venda
  useEffect(() => {
    if (!isOpen || !saleId) return;

    const fetchSale = async () => {
      setFetching(true);
      try {
        const response = await fetch(`/api/sales/${saleId}`);
        if (!response.ok) throw new Error('Erro ao buscar venda');

        const data = await response.json();
        setSaleData(data.sale);
        setItems(data.items || []);
      } catch (err) {
        console.error('Erro ao buscar venda:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchSale();
  }, [isOpen, saleId]);

  const handleCancel = () => {
    if (confirmText.toUpperCase() !== 'CANCELAR') {
      alert('Digite "CANCELAR" para confirmar');
      return;
    }

    onConfirm({ sale_id: saleId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-lg font-bold text-red-800">Cancelar Venda</h2>
            <p className="text-sm text-red-600">
              Esta ação não pode ser desfeita. O estoque será restaurado.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : saleData ? (
            <>
              {/* Sale Info */}
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600 font-medium">Venda ID:</span>
                    <p className="text-gray-800 font-mono text-xs">{saleData.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Total:</span>
                    <p className="text-gray-800 font-bold">
                      R$ {(saleData.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Data:</span>
                    <p className="text-gray-800">
                      {new Date(saleData.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Status:</span>
                    <p className="text-green-700 font-medium">
                      {saleData.status === 0 ? 'Cancelada' : 'Concluída'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items to Restore */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Itens a Restaurar:</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded p-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-sm border-b border-gray-200 pb-2 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {item.product?.name || 'Produto desconhecido'}
                        </p>
                        {item.batch?.batch_number && (
                          <p className="text-xs text-gray-600">
                            Lote: {item.batch.batch_number}
                            {item.batch?.expiry_date && (
                              <span> | Vence: {new Date(item.batch.expiry_date).toLocaleDateString('pt-BR')}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          {item.quantity} un.
                        </p>
                        <p className="text-xs text-gray-600">
                          R$ {(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  <span className="font-semibold">⚠️ Confirmação Necessária</span>
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Digite a palavra <span className="font-mono font-bold">CANCELAR</span> abaixo para confirmar:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Digite CANCELAR"
                  className="w-full px-3 py-2 border border-yellow-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Erro ao carregar dados da venda
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading || fetching}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Manter Venda
          </button>
          <button
            onClick={handleCancel}
            disabled={
              loading ||
              fetching ||
              confirmText.toUpperCase() !== 'CANCELAR'
            }
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Cancelar Venda
          </button>
        </div>
      </div>
    </div>
  );
}
