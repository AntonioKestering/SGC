// src/context/AuthContext.tsx

'use client';

import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Obtém a sessão inicial
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      const session = res.data.session;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuta mudanças na autenticação (login, logout, refresh)
    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Limpa o listener ao desmontar o componente
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Redireciona para o login após o logout
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};