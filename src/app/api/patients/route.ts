// src/app/api/patients/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    console.log('[API] GET /api/patients iniciado');

    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Erro ao buscar pacientes:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('[API] Pacientes carregados com sucesso:', patients?.length || 0);
    return NextResponse.json({ patients: patients || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/patients:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao buscar pacientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, cpf, phone, birth_date, medical_history } = body;

    if (!full_name) {
      return NextResponse.json(
        { error: 'Nome do paciente é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert([
        {
          full_name,
          cpf: cpf || null,
          phone: phone || null,
          birth_date: birth_date || null,
          medical_history: medical_history || null,
        },
      ])
      .select();

    if (error) {
      console.error('[API] Erro ao criar paciente:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { patient: data?.[0] },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API] Erro inesperado em POST /api/patients:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao criar paciente' },
      { status: 500 }
    );
  }
}
