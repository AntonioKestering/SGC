// src/app/api/patients/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createRouteClient();

    // Obter usuário logado e sua organização (FILTRO DE SEGURANÇA CRÍTICO)
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

    // Força filtro por organization_id (SEGURANÇA APLICAÇÃO + RLS)
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, full_name, cpf, phone, birth_date, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Normalizar nomes de campos para o frontend (full_name -> name)
    const normalizedPatients = (patients || []).map((patient: any) => ({
      id: patient.id,
      name: patient.full_name,
      cpf: patient.cpf,
      phone: patient.phone,
      birth_date: patient.birth_date,
      created_at: patient.created_at,
    }));
    
    return NextResponse.json({ patients: normalizedPatients });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createRouteClient();
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

    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...body, organization_id: profile.organization_id }])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ patient: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}