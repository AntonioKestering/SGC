import { createRouteClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();

    // 1. Obter dados do usuário logado para verificar a ROLE
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // 2. Construir a Query base
    let query = supabase
      .from('specialists')
      .select(`
        id, 
        profile_id, 
        specialty, 
        registry_number, 
        color_code,
        profiles:profile_id (id, full_name, email, role)
      `);

    // REGRA DE NEGÓCIO: Se NÃO for admin, filtra para ver apenas o próprio registro
    if (currentUserProfile?.role !== 'admin') {
      query = query.eq('profile_id', user.id);
    }

    const { data: specialists, error: specError } = await query;

    if (specError) {
      return NextResponse.json({ error: specError.message }, { status: 400 });
    }

    const result = (specialists || []).map((spec: any) => ({
      ...spec,
      full_name: spec.profiles?.full_name || '',
      email: spec.profiles?.email || '',
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

    const supabase = await createRouteClient();

    // 1. Validar usuário e verificar se ele é ADMIN
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    // REGRA DE SEGURANÇA: Apenas Admins podem cadastrar especialistas
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem cadastrar especialistas.' }, { status: 403 });
    }

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // 2. Inserir o novo especialista
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