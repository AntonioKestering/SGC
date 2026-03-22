// src/app/api/user-settings/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createRouteClient();

    // 1. Pega o usuário da sessão (via cookies)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Busca as configurações usando o cliente que respeita o RLS
    // O .eq('user_id', user.id) é um reforço, mas o RLS já deveria filtrar isso.
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[API] Erro ao buscar configurações:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || null });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notify_expiry, notify_days_before } = body;

    const payload = {
      user_id: user.id,
      notify_expiry: Boolean(notify_expiry),
      notify_days_before: Number(notify_days_before) || 0,
    };

    // O upsert respeitará o RLS: se o usuário tentar dar upsert 
    // num user_id que não é dele, o banco negará (se o RLS estiver ON).
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.error('[API] Erro ao salvar configurações:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}