// src/app/api/specialists/route.ts
import { createRouteClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();

    // Com o createRouteClient, o RLS filtrará automaticamente especialistas 
    // que pertencem à mesma organization_id do usuário logado.
    const { data: specialists, error: specError } = await supabase
      .from('specialists')
      .select(`
        id, 
        profile_id, 
        specialty, 
        registry_number, 
        color_code,
        profiles:profile_id (
          id,
          full_name,
          email
        )
      `);

    if (specError) {
      console.error('[API] Error:', specError);
      return NextResponse.json({ error: specError.message }, { status: 400 });
    }

    // Formatamos o retorno para manter compatibilidade com seu frontend
    const result = (specialists || []).map((spec: any) => ({
      ...spec,
      full_name: spec.profiles?.full_name || '',
      email: spec.profiles?.email || '',
      // Mantendo o array profiles se o seu componente esperar esse formato
      profiles: spec.profiles ? [spec.profiles] : []
    }));

    return NextResponse.json({ specialists: result });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar especialistas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specialty, profile_id, registry_number, color_code } = body;

    if (!specialty) {
      return NextResponse.json({ error: 'Especialidade é obrigatória' }, { status: 400 });
    }

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

    // 2. Inserir com organization_id para garantir o isolamento
    const { data, error } = await supabase
      .from('specialists')
      .insert([{ 
        specialty, 
        profile_id: profile_id || null,
        registry_number: registry_number || null,
        color_code: color_code || null,
        organization_id: profile.organization_id 
      }])
      .select(`
        id,
        specialty,
        profiles:profile_id (id, full_name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ specialist: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao criar especialista' }, { status: 500 });
  }
}