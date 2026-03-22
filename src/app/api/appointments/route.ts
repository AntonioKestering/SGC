// src/app/api/appointments/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = await createRouteClient();

    // O cliente criado com 'createRouteClient' injeta o token do usuário logado.
    // O Postgres filtrará automaticamente com base no RLS.
    let query = supabase
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
      console.error('[API] Erro ao buscar agendamentos:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { specialist_id, patient_id, start_time, end_time, status, notes } = body;

    const supabase = await createRouteClient();

    // 1. Validar usuário e obter organização
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // 2. Inserir agendamento com o organization_id forçado
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          specialist_id,
          patient_id,
          start_time,
          end_time,
          status: status || 'agendado',
          notes: notes || null,
          organization_id: profile.organization_id // Garante o isolamento no insert
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
      console.error('[API] Erro ao criar agendamento:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
  }
}