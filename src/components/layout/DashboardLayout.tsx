// src/components/Layout/DashboardLayout.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ExpiringProductsAlert } from '@/components/ExpiringProductsAlert';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  // Lógica de proteção
  useState(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  });

  // Checar configurações do usuário e exibir alerta de produtos vencendo
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    // Verifica se o alerta foi descartado (cookie local)
    const isDismissed = document.cookie.includes('dismissed_expiry_alert=true');
    if (isDismissed) {
      setAlertDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Se não foi descartado no cookie, verifica no banco (sincroniza entre abas/dispositivos)
    async function checkDismissStatus() {
      if (alertDismissed || loading || !user) return;
      try {
        const supabase = getSupabaseClient();
        const sres = await supabase.auth.getSession();
        const token = sres.data.session?.access_token;
        if (!token) return;

        const confRes = await fetch('/api/user-settings', { headers: { Authorization: `Bearer ${token}` } });
        if (!confRes.ok) return;
        const confJson = await confRes.json();
        const settings = confJson.settings;

        if (settings?.last_expiry_alert_dismissed) {
          const lastDismissed = new Date(settings.last_expiry_alert_dismissed);
          const now = new Date();
          const diffHours = (now.getTime() - lastDismissed.getTime()) / (1000 * 60 * 60);
          
          // Se foi descartado há menos de 24h, marca como descartado
          if (diffHours < 24) {
            // Define o cookie para sincronizar com outras abas
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.cookie = `dismissed_expiry_alert=true; expires=${tomorrow.toUTCString()}; path=/`;
            setAlertDismissed(true);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do dismiss:', err);
      }
    }

    checkDismissStatus();
  }, [alertDismissed, loading, user]);
  useEffect(() => {
    async function loadProfile() {
        if (!user) return;
        const supabase = getSupabaseClient();
        
        // Como o RLS agora permite 'id = auth.uid()', esta query vai funcionar:
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error.message);
          return;
        }

        if (data?.full_name) {
          setUserName(data.full_name);
        }
      }

      loadProfile();

    async function checkAlerts() {
      if (loading || !user) return;
      try {
        const supabase = getSupabaseClient();
        const sres = await supabase.auth.getSession();
        const token = sres.data.session?.access_token;
        if (!token) return;

        // Buscar configurações do usuário
        const confRes = await fetch('/api/user-settings', { headers: { Authorization: `Bearer ${token}` } });
        if (!confRes.ok) return;
        const confJson = await confRes.json();
        const settings = confJson.settings;
        if (!settings || !settings.notify_expiry) return;

        // Buscar produtos próximos do vencimento
        const days = settings.notify_days_before ?? 7;
        const prodRes = await fetch(`/api/products/expiring?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!prodRes.ok) return;
        const prodJson = await prodRes.json();
        const products = prodJson.products || [];
        if (products.length > 0) setExpiringProducts(products);
      } catch (err) {
        console.error('Erro ao checar alertas:', err);
      }
    }

    checkAlerts();
  }, [loading, user]);

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
        {/* Componente de alerta para produtos vencendo com dismiss */}
        {!alertDismissed && (
          <ExpiringProductsAlert
            products={expiringProducts}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}
        {/* Cabeçalho superior com botão de Logout */}
        <header className="flex justify-between items-center pb-2 border-b border-zinc-700 mb-5">
            <h1 className="text-1xl font-light text-zinc-400 flex items-center gap-2">
              Olá, {userName || user.email}
              {user.user_metadata?.role === 'super_admin' && (
                <span className="text-xs bg-pink-500/20 text-pink-500 px-2 py-1 rounded-full border border-pink-500/50 font-medium">
                  Super Admin
                </span>
              )}
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