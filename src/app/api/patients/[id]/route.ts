import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // O RLS filtrará automaticamente. Se o paciente não for da clínica 
    // do usuário, o single() retornará erro (objeto não encontrado).
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Erro ao buscar paciente:', error.message);
      return NextResponse.json(
        { error: 'Paciente não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createRouteClient();

    // Remova campos sensíveis que não devem ser alterados via PUT se necessário
    // const { id: _, organization_id: __, ...updateData } = body;

    const { data, error } = await supabase
      .from('patients')
      .update(body) // O RLS garante que só atualize se pertencer à empresa
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Paciente não encontrado ou sem permissão para editar' },
        { status: 403 }
      );
    }

    return NextResponse.json({ patient: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao processar atualização' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Nota: No DELETE com RLS, se o registro não existir ou não pertencer
    // ao usuário, o Supabase não retorna erro, mas também não deleta nada.
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}