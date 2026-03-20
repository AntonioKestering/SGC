// src/app/api/appointments/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('[API] GET /api/appointments - startDate:', startDate, 'endDate:', endDate);
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        specialist:specialist_id(
          id,
          specialty,
          color_code,
          profiles(id, full_name, email)
        ),
        patient:patient_id(id, full_name, phone)
      `);

    if (startDate && endDate) {
      query = query
        .gte('start_time', startDate)
        .lte('start_time', endDate);
    }

    const { data: appointments, error } = await query
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[API] Erro ao buscar agendamentos:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('[API] Agendamentos carregados:', appointments?.length || 0);
    return NextResponse.json({ appointments: appointments || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/appointments:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao buscar agendamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { specialist_id, patient_id, start_time, end_time, status, notes } = body;

    if (!specialist_id || !patient_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert([
        {
          specialist_id,
          patient_id,
          start_time,
          end_time,
          status: status || 'agendado',
          notes: notes || null,
        },
      ])
      .select(`
        *,
        specialist:specialist_id(
          id,
          specialty,
          color_code,
          profiles(id, full_name, email)
        ),
        patient:patient_id(id, full_name, phone)
      `);

    if (error) {
      console.error('[API] Erro ao criar agendamento:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { appointment: data?.[0] },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API] Erro inesperado em POST /api/appointments:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}
