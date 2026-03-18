// src/app/dashboard/page.tsx (SIMPLIFICADO)

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  // Este é o conteúdo que será renderizado dentro do <main> do DashboardLayout
  return (
    <DashboardLayout>
        {/* CONTEÚDO REAL DO DASHBOARD */}
        <h2 className="text-2xl font-semibold text-zinc-50">Visão Geral</h2>
        <p className="mt-2 text-zinc-400">
            Acompanhe os principais indicadores da clínica.
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Placeholder (Mantido o estilo escuro elegante) */}
            <div className="bg-zinc-900 p-6 rounded-xl shadow-xl border-t-4 border-pink-500">
                <h3 className="text-xl font-medium text-zinc-200">Agenda Hoje</h3>
                <p className="mt-1 text-3xl font-bold text-zinc-50">12</p>
                <p className="text-sm text-zinc-400">Agendamentos Confirmados</p>
            </div>
        </div>
        
    </DashboardLayout>
  );
}