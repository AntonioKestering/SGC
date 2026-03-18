// src/components/Layout/DashboardLayout.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Lógica de proteção
  useState(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-pink-500 bg-zinc-950">
        Carregando SGC...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      
      {/* 1. SIDEBAR (Menu Fixo) */}
      <aside className="w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* 2. CONTEÚDO PRINCIPAL (Scrollável) */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        {/* Cabeçalho superior com botão de Logout */}
        <header className="flex justify-between items-center pb-6 border-b border-zinc-800 mb-8">
            <h1 className="text-3xl font-light text-zinc-100">
                Olá, {user.email}!
            </h1>
            <button 
                onClick={signOut} 
                className="py-2 px-6 border border-pink-500 rounded-full 
                           text-sm font-medium text-pink-500 bg-zinc-900 
                           hover:bg-zinc-800 transition duration-150 ease-in-out"
            >
                Sair
            </button>
        </header>

        {children}
      </main>
    </div>
  );
}