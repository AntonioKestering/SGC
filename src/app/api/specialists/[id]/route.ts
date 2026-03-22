import { createRouteClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // O RLS garante que o especialista pertença à organização do usuário
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

    // Formatamos o objeto para manter a compatibilidade com seu frontend
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

    if (!specialty) {
      return NextResponse.json({ error: 'Especialidade é obrigatória' }, { status: 400 });
    }

    // O update só funcionará se o RLS validar o organization_id
    const { data: specialist, error: updateError } = await supabase
      .from('specialists')
      .update({ specialty, registry_number, color_code })
      .eq('id', id)
      .select(`
        id, 
        profile_id, 
        specialty, 
        registry_number, 
        color_code,
        profiles:profile_id (id, full_name, email)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar ou acesso negado' }, { status: 403 });
    }

    const result = {
      ...specialist,
      full_name: (specialist.profiles as any)?.full_name || '',
      email: (specialist.profiles as any)?.email || '',
      profiles: specialist.profiles ? [specialist.profiles] : []
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

    // O RLS impede que se delete um especialista de outra clínica
    const { error: deleteError } = await supabase
      .from('specialists')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao deletar ou acesso negado' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Especialista deletado com sucesso' });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao deletar especialista' }, { status: 500 });
  }
}