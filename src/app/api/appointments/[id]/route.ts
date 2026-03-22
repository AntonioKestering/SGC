import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        specialist:specialist_id(
          id,
          specialty,
          profiles(id, full_name, email)
        ),
        patient:patient_id(id, full_name, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Erro ao buscar agendamento:', error.message);
      return NextResponse.json(
        { error: 'Agendamento não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
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

    // Removemos campos que não devem ser alterados manualmente para evitar fraude
    const { id: _, organization_id: __, ...updateData } = body;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        specialist:specialist_id(
          id, 
          specialty,
          profiles(id, full_name)
        ),
        patient:patient_id(id, full_name, phone)
      `);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado ou sem permissão' },
        { status: 403 }
      );
    }

    return NextResponse.json({ appointment: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
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
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}