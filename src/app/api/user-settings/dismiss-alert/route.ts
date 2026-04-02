// src/app/api/user-settings/dismiss-alert/route.ts
// Endpoint para registrar que o usuário descartou o alerta de vencimento

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    // 1. Inicializa o cliente que respeita os Cookies e o RLS
    const supabase = await createRouteClient();

    // 2. Verifica se o usuário está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Busca as settings do usuário para verificar último dismiss
    const { data: settings, error: fetchError } = await supabase
      .from('user_settings')
      .select('last_expiry_alert_dismissed')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (usuário não tem settings ainda)
      console.error('[API] Erro ao buscar settings:', fetchError.message);
    }

    // 4. Verifica se foi descartado nos últimos 24h
    if (settings?.last_expiry_alert_dismissed) {
      const lastDismissed = new Date(settings.last_expiry_alert_dismissed);
      const now = new Date();
      const diffHours = (now.getTime() - lastDismissed.getTime()) / (1000 * 60 * 60);
      
      // Se foi descartado há menos de 24h, retorna sucesso (não faz nada)
      if (diffHours < 24) {
        return NextResponse.json({ 
          success: true, 
          message: 'Alerta já foi descartado recentemente',
          dismissedAt: settings.last_expiry_alert_dismissed,
          hoursRemaining: Math.ceil(24 - diffHours)
        });
      }
    }

    // 5. Atualiza o timestamp no banco de dados
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('user_settings')
      .update({ last_expiry_alert_dismissed: now })
      .eq('user_id', user.id);

    if (error) {
      console.error('[API] Erro ao atualizar dismiss timestamp:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, dismissedAt: now });
  } catch (err: any) {
    console.error('[API] Erro inesperado em POST /api/user-settings/dismiss-alert:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
