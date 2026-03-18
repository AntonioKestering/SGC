// src/app/setup/page.tsx

'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function checkMigration() {
    setLoading(true);
    try {
      const res = await fetch('/api/migrations/add-phone-column', {
        method: 'POST'
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-50 mb-6">Configuração Inicial</h1>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">Migração: Adicionar coluna phone</h2>
            <p className="text-zinc-400 mb-4">
              Para adicionar o suporte a telefone nos usuários, é necessário adicionar uma coluna 'phone' à tabela 'profiles' no Supabase.
            </p>

            <button
              onClick={checkMigration}
              disabled={loading}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-700 text-white rounded-lg transition"
            >
              {loading ? 'Verificando...' : 'Verificar/Executar Migração'}
            </button>

            {result && (
              <div className={`mt-6 p-4 rounded-lg border ${
                result.status === 'success' || result.status === 'column_missing'
                  ? 'bg-blue-900 border-blue-700 text-blue-200'
                  : 'bg-red-900 border-red-700 text-red-200'
              }`}>
                <p className="font-semibold mb-2">Resultado:</p>
                <p>{result.message || result.error}</p>

                {result.manual_sql && (
                  <div className="mt-4 p-4 bg-black bg-opacity-50 rounded text-zinc-300 font-mono text-sm">
                    <p className="mb-2 text-zinc-400">SQL a executar no Supabase:</p>
                    <code>{result.manual_sql}</code>
                  </div>
                )}

                {result.instructions && (
                  <div className="mt-4 p-4 bg-blue-950 rounded">
                    <p className="font-semibold mb-2">Instruções:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Acesse <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline text-pink-400">app.supabase.com</a></li>
                      <li>Selecione seu projeto</li>
                      <li>Vá em "SQL Editor"</li>
                      <li>Cole o SQL acima e execute</li>
                      <li>Retorne aqui e clique novamente em "Verificar/Executar Migração"</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-700 pt-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">Todos os passos de setup:</h3>
            <ul className="space-y-2 text-zinc-400">
              <li>✓ Criar coluna phone na tabela profiles (veja acima)</li>
              <li>✓ Sistema pronto para usar campos de telefone</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
