import { createRouteClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // Buscamos o especialista. O RLS já filtrará se o usuário tem acesso.
    const { data: specialist, error: specError } = await supabase
      .from('specialists')
      .select(`
        id, 
        profile_id, 
        specialty, 
        registry_number, 
        color_code,
        profiles:profile_id (id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (specError || !specialist) {
      return NextResponse.json({ error: 'Especialista não encontrado ou acesso negado' }, { status: 404 });
    }

    const result = {
      ...specialist,
      full_name: (specialist.profiles as any)?.full_name || '',
      email: (specialist.profiles as any)?.email || '',
      profiles: specialist.profiles ? [specialist.profiles] : []
    };

    return NextResponse.json({ specialist: result });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { specialty, registry_number, color_code } = await request.json();
    const supabase = await createRouteClient();

    // 1. Verificar quem está tentando editar
    const { data: { user: executor } } = await supabase.auth.getUser();
    if (!executor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: executorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', executor.id)
      .single();

    // 2. Buscar o especialista alvo para conferir o profile_id
    const { data: target } = await supabase
      .from('specialists')
      .select('profile_id')
      .eq('id', id)
      .single();

    if (!target) return NextResponse.json({ error: 'Especialista não encontrado' }, { status: 404 });

    // REGRA: Só Admin pode editar outros. Especialista só edita a si mesmo.
    if (executorProfile?.role !== 'admin' && target.profile_id !== executor.id) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este perfil' }, { status: 403 });
    }

    // 3. Executar o Update
    const { data: updated, error: updateError } = await supabase
      .from('specialists')
      .update({ specialty, registry_number, color_code })
      .eq('id', id)
      .select(`
        id, profile_id, specialty, registry_number, color_code,
        profiles:profile_id (id, full_name, email)
      `)
      .single();

    if (updateError) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 400 });

    const result = {
      ...updated,
      full_name: (updated.profiles as any)?.full_name || '',
      email: (updated.profiles as any)?.email || '',
      profiles: updated.profiles ? [updated.profiles] : []
    };

    return NextResponse.json({ specialist: result });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao atualizar especialista' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // 1. Identificar o executor
    const { data: { user: executor } } = await supabase.auth.getUser();
    if (!executor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: executorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', executor.id)
      .single();

    // 2. Verificar se é Admin (Apenas admin deleta)
    if (executorProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir especialistas' }, { status: 403 });
    }

    // 3. Buscar o especialista alvo para evitar autodeleção
    const { data: target } = await supabase
      .from('specialists')
      .select('profile_id')
      .eq('id', id)
      .single();

    if (target?.profile_id === executor.id) {
      return NextResponse.json({ error: 'Você não pode excluir seu próprio cadastro' }, { status: 400 });
    }

    // 4. Deletar
    const { error: deleteError } = await supabase
      .from('specialists')
      .delete()
      .eq('id', id);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

    return NextResponse.json({ message: 'Especialista deletado com sucesso' });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao deletar especialista' }, { status: 500 });
  }
}