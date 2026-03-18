// src/app/auth/reset-password/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verifica se há um token na URL (enviado pelo Supabase)
    const hash = window.location.hash;
    if (!hash.includes('access_token')) {
      setError('Link de reset inválido ou expirado. Solicite um novo link.');
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message || 'Erro ao atualizar a senha');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setPassword('');
    setConfirmPassword('');

    // Redireciona para login após 3 segundos
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-lg shadow-md border border-zinc-800">
        <h2 className="text-center text-3xl font-extrabold text-zinc-50">
          Redefinir Senha
        </h2>

        {/* Mensagem de sucesso */}
        {success && (
          <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-green-400 text-sm text-center">
              ✓ Senha redefinida com sucesso! Redirecionando para login...
            </p>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Campo Nova Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1 block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="mt-1 block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition"
            >
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}

        {/* Link para voltar ao login */}
        {success && (
          <div className="text-center">
            <p className="text-zinc-400 text-sm">
              Será redirecionado para login em instantes...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
