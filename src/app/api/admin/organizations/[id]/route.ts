// src/app/api/admin/organizations/[id]/route.ts
// API para buscar, editar e deletar organizações (apenas super_admin)

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 3. Buscar a organização
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !organization) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/admin/organizations/[id]:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, full_name, email, phone, status } = body;

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

    // 3. Atualizar a organização
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: name || undefined,
        full_name: full_name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        status: status || undefined,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[API] Erro ao atualizar organização:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ organization: data[0] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em PUT /api/admin/organizations/[id]:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 3. Deletar a organização
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar organização:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro inesperado em DELETE /api/admin/organizations/[id]:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
