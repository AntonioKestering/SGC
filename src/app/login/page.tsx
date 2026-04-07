// src/app/login/page.tsx

'use client'; // Indica que este é um componente interativo do lado do cliente

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient'; // Importa a conexão que você criou
import { useRouter } from 'next/navigation';
import { PasswordResetModal } from '@/components/PasswordResetModal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning' | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // Função para mapear erros do Supabase para mensagens amigáveis
  const getErrorMessage = (errorMessage: string) => {
    if (errorMessage.includes('Invalid login credentials')) {
      return {
        message: 'Email ou senha incorretos. Verifique seus dados e tente novamente.',
        type: 'error' as const,
      };
    }
    if (errorMessage.includes('Email not confirmed')) {
      return {
        message: 'Sua conta ainda não foi ativada. Verifique seu email para confirmar o registro.',
        type: 'warning' as const,
      };
    }
    if (errorMessage.includes('User not found')) {
      return {
        message: 'Usuário não encontrado. Verifique o email digitado.',
        type: 'error' as const,
      };
    }
    if (errorMessage.includes('Too many requests')) {
      return {
        message: 'Muitas tentativas de login. Tente novamente mais tarde.',
        type: 'warning' as const,
      };
    }
    return {
      message: errorMessage || 'Erro ao fazer login. Tente novamente.',
      type: 'error' as const,
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorType(null);

    // Validação básica
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha email e senha.');
      setErrorType('warning');
      setLoading(false);
      return;
    }

    // 1. CHAMA A FUNÇÃO DE LOGIN DO SUPABASE
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const { message, type } = getErrorMessage(error.message);
      setError(message);
      setErrorType(type);
      setLoading(false);
      return;
    }

    // 2. Verificar quantas organizações o usuário tem
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        const orgResponse = await fetch('/api/user/organizations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          const orgs = orgData.organizations || [];

          // Se tem mais de 1 organização, redireciona para seleção
          if (orgs.length > 1) {
            router.push('/organization-select');
            return;
          }
          
          // Se tem 1 organização, salva no localStorage e vai para dashboard
          if (orgs.length === 1) {
            localStorage.setItem('selected_organization_id', orgs[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao verificar organizações:', err);
      // Continue mesmo se houver erro
    }

    // 3. REDIRECIONA PARA O DASHBOARD
    router.push('/dashboard');
  };

  // Função para reenviar email de confirmação
  const handleResendConfirmationEmail = async () => {
    if (!email.trim()) {
      setError('Por favor, preencha o campo de email.');
      setErrorType('warning');
      return;
    }

    setResendingEmail(true);
    setResendSuccess(false);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    setResendingEmail(false);

    if (resendError) {
      setError(`Erro ao reenviar email: ${resendError.message}`);
      setErrorType('error');
      return;
    }

    setResendSuccess(true);
    setError(null);

    // Mostra mensagem de sucesso por 5 segundos
    setTimeout(() => {
      setResendSuccess(false);
    }, 5000);
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-lg shadow-md border border-zinc-800">
          <h2 className="text-center text-3xl font-extrabold text-zinc-50">
            Acessar SGC
          </h2>

          {/* MENSAGEM DE SUCESSO - REENVIO DE EMAIL */}
          {resendSuccess && (
            <div className="p-4 rounded-lg border bg-green-900/20 border-green-800 text-green-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">✓ Email enviado com sucesso!</p>
                  <p className="text-xs mt-1 opacity-75">
                    Verifique sua caixa de entrada e a pasta de spam.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MENSAGEM DE ERRO */}
          {error && !resendSuccess && (
            <div className={`p-4 rounded-lg border ${
              errorType === 'warning'
                ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
                : 'bg-red-900/20 border-red-800 text-red-300'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  {errorType === 'warning' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{error}</p>
                  {errorType === 'warning' && error?.includes('não foi ativada') && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-75">
                        Se não recebeu o email, verifique a pasta de spam.
                      </p>
                      <button
                        type="button"
                        onClick={handleResendConfirmationEmail}
                        disabled={resendingEmail || !email.trim()}
                        className="text-xs font-medium py-1.5 px-3 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 rounded transition"
                      >
                        {resendingEmail ? 'Reenviando...' : 'Reenviar email de confirmação'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* CAMPO EMAIL */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* CAMPO SENHA */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* BOTÃO DE SUBMISSÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* BOTÃO "ESQUECI MINHA SENHA" - UX: Link sutil abaixo do formulário */}
          <div className="text-center pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="text-sm text-pink-500 hover:text-pink-400 transition font-medium"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE RESET DE SENHA */}
      <PasswordResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />
    </>
  );
}