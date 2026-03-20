// src/app/api/appointments/[id]/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: appointment, error } = await supabaseAdmin
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
      console.error('[API] Erro ao buscar agendamento:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/appointments/[id]:', err);
    return NextResponse.json(
      { error: err.message },
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

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        specialist:specialist_id(id, full_name, specialty),
        patient:patient_id(id, full_name, phone)
      `);

    if (error) {
      console.error('[API] Erro ao atualizar agendamento:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment: data?.[0] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em PUT /api/appointments/[id]:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar agendamento:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro inesperado em DELETE /api/appointments/[id]:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
