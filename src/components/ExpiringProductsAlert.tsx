// src/components/ExpiringProductsAlert.tsx
'use client';

import { useState } from 'react';

interface Product {
  id: string;
  barcode?: string;
  name: string;
  expiry_date: string;
  stock_quantity: number;
  batch_number?: string;
}

interface ExpiringProductsAlertProps {
  products: Product[];
  onDismiss: () => void;
  dismissedAt?: string | null;
}

export function ExpiringProductsAlert({
  products,
  onDismiss,
  dismissedAt,
}: ExpiringProductsAlertProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDismiss = async () => {
    setIsLoading(true);
    try {
      // Define cookie local por 24h primeiro (funciona offline)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.cookie = `dismissed_expiry_alert=true; expires=${tomorrow.toUTCString()}; path=/`;

      // Tenta sincronizar com o banco em background
      const res = await fetch('/api/user-settings/dismiss-alert', {
        method: 'POST',
      });

      if (res.ok) {
        // Sucesso - dispara callback para remover do render
        onDismiss();
      } else {
        // Mesmo se falhar, o cookie local já está set
        // A próxima sessão sincronizará com o banco
        onDismiss();
      }
    } catch (err) {
      console.error('Erro ao descartar alerta:', err);
      // Mesmo com erro, o cookie foi definido
      onDismiss();
    } finally {
      setIsLoading(false);
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-lg bg-yellow-900 border border-yellow-700 text-yellow-100 flex justify-between items-start">
      <div className="flex-1">
        <strong className="block mb-2">Atenção — Lotes próximos ou após o vencimento com estoque:</strong>
        <ul className="list-disc list-inside text-sm space-y-1">
          {products.map((p) => (
            <li key={p.id}>
              {p.barcode ? `${p.barcode} - ` : ''}{p.name} (Lote: {p.batch_number}) - Vencimento: {new Date(p.expiry_date).toLocaleDateString('pt-BR')} - Estoque: {p.stock_quantity}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleDismiss}
        disabled={isLoading}
        className="ml-4 px-3 py-1 bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 rounded text-sm font-medium text-yellow-100 whitespace-nowrap transition-colors"
        title="Não exibir este aviso novamente por 24 horas"
      >
        {isLoading ? 'Processando...' : '✕ Hoje não'}
      </button>
    </div>
  );
}
