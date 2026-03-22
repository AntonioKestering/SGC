// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createRouteClient();

    // 1. Verifica quem é o usuário que está fazendo a requisição
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscamos os usuários DIRETO da tabela profiles.
    // Como estamos usando o createRouteClient (ANON_KEY), 
    // o RLS do banco de dados vai filtrar automaticamente para que 
    // o usuário só veja os colegas da MESMA organização.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, organization_id')
      .order('full_name', { ascending: true });

    if (profilesError) {
      console.error('[API] Erro ao buscar profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // 3. Retornamos a lista já filtrada pelo banco de dados
    console.log(`[API] ${profiles?.length} usuários encontrados para esta organização.`);
    
    return NextResponse.json({ users: profiles || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/admin/users:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}