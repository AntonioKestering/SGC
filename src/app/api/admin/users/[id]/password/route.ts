// src/app/api/admin/users/[id]/password/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createRouteClient } from '@/lib/supabaseServer';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID do usuário é necessário' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { password } = body;

    // Validações básicas de senha
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const supabase = await createRouteClient();
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Validar quem está tentando realizar a ação
    const { data: { user: executor }, error: authError } = await supabase.auth.getUser();
    if (authError || !executor) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Verificar se o usuário ALVO (o 'id' da URL) pertence à organização do executor.
    // O RLS na tabela 'profiles' deve estar configurado para que o executor 
    // só consiga ler perfis da própria organização.
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', id)
      .single();

    // Se o targetError ocorrer ou o perfil não vier, significa que o usuário 
    // ou não existe ou pertence a outra clínica.
    if (targetError || !targetProfile) {
      console.warn(`[Segurança] Tentativa de alterar senha de usuário fora da organização: Executor ${executor.id} -> Alvo ${id}`);
      return NextResponse.json(
        { error: 'Usuário não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    // 3. (Opcional) Validar se o executor é 'admin' ou 'owner' se você tiver papéis
    // if (targetProfile.role === 'owner' && executor_role !== 'owner') ...

    // 4. Se passou em todas as checagens, usamos o ADMIN para trocar a senha no Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password,
    });

    if (updateError) {
      console.error('[API] Erro ao atualizar senha no Auth:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (err: any) {
    console.error('[API] Erro inesperado em PUT /password:', err);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}