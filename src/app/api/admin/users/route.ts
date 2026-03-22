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

    // 2. Opcional: Buscar o org_id do usuário atual primeiro para garantir
    // que ele tem uma organização antes de listar
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', currentUser.id)
      .single();

    if (!myProfile?.organization_id) {
      console.warn(`[API] Usuário ${currentUser.id} tentou listar usuários sem ter organization_id.`);
      return NextResponse.json({ users: [] });
    }

    // 3. Busca os perfis. O .eq garante que, mesmo que o RLS falhe, 
    // a API ainda filtre por organização.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, organization_id')
      .eq('organization_id', myProfile.organization_id) // Filtro explícito além do RLS
      .order('full_name', { ascending: true });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}