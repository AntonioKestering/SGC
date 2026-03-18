// src/app/api/patients/[id]/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Erro ao buscar paciente:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/patients/[id]:', err);
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

    const { data, error } = await supabaseAdmin
      .from('patients')
      .update(body)
      .eq('id', id)
      .select();

    if (error) {
      console.error('[API] Erro ao atualizar paciente:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ patient: data?.[0] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em PUT /api/patients/[id]:', err);
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

    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar paciente:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro inesperado em DELETE /api/patients/[id]:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
