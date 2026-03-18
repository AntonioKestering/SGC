// src/components/PasswordResetModal.tsx

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message || 'Erro ao enviar e-mail de reset');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail('');
    setLoading(false);

    // Fecha o modal após 3 segundos
    setTimeout(() => {
      onClose();
      setSuccess(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 w-full max-w-md p-8">
        {/* Header com botão de fechar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-zinc-50">Redefinir Senha</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mensagem de sucesso */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-green-400 text-sm">
              ✓ Link de reset enviado para seu e-mail. Verifique sua caixa de entrada.
            </p>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Formulário */}
        {!success && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-zinc-300 mb-2">
                E-mail cadastrado
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>

            <p className="text-xs text-zinc-400">
              Enviaremos um link de reset de senha para este e-mail. O link é válido por 24 horas.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-lg text-white font-medium transition"
              >
                {loading ? 'Enviando...' : 'Enviar Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
