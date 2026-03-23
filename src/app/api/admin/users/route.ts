// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createRouteClient();

    // 1. Pega o usuário da sessão
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscamos a ORG e a ROLE do usuário logado
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('organization_id, role') // <-- Adicionado 'role' aqui
      .eq('id', currentUser.id)
      .single();

    if (!myProfile?.organization_id) {
      console.warn(`[API] Usuário ${currentUser.id} sem organization_id.`);
      return NextResponse.json({ users: [] });
    }

    // 3. Montamos a query base filtrando pela organização
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, organization_id')
      .eq('organization_id', myProfile.organization_id);

    // --- A CORREÇÃO ESTÁ AQUI ---
    // Se o usuário não for 'admin', ele só pode ver o registro dele mesmo (id = seu próprio id)
    if (myProfile.role !== 'admin') {
      query = query.eq('id', currentUser.id);
    }
    // ----------------------------

    const { data: profiles, error: profilesError } = await query
      .order('full_name', { ascending: true });

    if (profilesError) {
      console.error('[API] Erro ao buscar profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}