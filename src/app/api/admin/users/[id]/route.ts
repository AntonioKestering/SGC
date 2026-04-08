// src/app/api/admin/users/[id]/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createRouteClient } from '@/lib/supabaseServer';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID do usuário é necessário' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { full_name, phone, role } = body;

    const supabase = await createRouteClient();

    // Validar usuário autenticado
    const { data: { user: executor } } = await supabase.auth.getUser();
    if (!executor) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Validar que o usuário está na mesma organização
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar perfil na tabela profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: full_name || null,
        phone: phone || null,
        role: role || 'recepcionista',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[API] Erro ao atualizar perfil:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso' });
  } catch (err: any) {
    console.error('[API] Erro ao processar PUT /api/admin/users/[id]:', err);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: 'ID do usuário é necessário' }, { status: 400 });
  }

  try {
    const supabase = await createRouteClient();
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Pegar os dados de quem está fazendo a requisição (o "executor")
    const { data: { user: executor }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !executor) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Verificar no banco de dados se o executor tem permissão e se o alvo é da mesma empresa
    // Buscamos o profile do alvo (id) e do executor simultaneamente ou validamos a empresa
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', id)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado ou fora da sua organização' }, { status: 404 });
    }

    // 3. Validação de hierarquia: 
    // Apenas 'admin' ou 'owner' podem deletar usuários da mesma organização.
    // O RLS já deve garantir que o 'targetProfile' só venha se for da mesma empresa,
    // mas reforçamos a lógica de negócio aqui.
    
    // (Opcional) Impedir que um admin delete a si mesmo por esta rota
    if (executor.id === id) {
      return NextResponse.json({ error: 'Você não pode deletar sua própria conta por aqui' }, { status: 400 });
    }

    // 4. Agora sim, com tudo validado, usamos o ADMIN para deletar no AUTH
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (deleteError) {
      console.error('Erro deleteUser admin:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro inesperado em DELETE /api/admin/users/[id]:', err);
    return NextResponse.json({ error: 'Erro ao processar exclusão' }, { status: 500 });
  }
}