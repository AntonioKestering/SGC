// src/app/api/admin/organizations/route.ts
// API para listar e criar organizações (apenas super_admin)

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createRouteClient();

    // 1. Verificar se usuário está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Verificar se é super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
    }

    // 3. Buscar todas as organizações
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Erro ao buscar organizações:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ organizations: organizations || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/admin/organizations:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, full_name, email, phone, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome da organização é obrigatório' }, { status: 400 });
    }

    const supabase = await createRouteClient();

    // 1. Verificar se usuário está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Verificar se é super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
    }

    // 3. Criar a nova organização
    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          name,
          full_name: full_name || null,
          email: email || null,
          phone: phone || null,
          status: status || 'trial',
          owner_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error('[API] Erro ao criar organização:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ organization: data?.[0] }, { status: 201 });
  } catch (err: any) {
    console.error('[API] Erro inesperado em POST /api/admin/organizations:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
