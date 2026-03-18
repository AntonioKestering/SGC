// src/app/api/admin/users/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    console.log('[API] GET /api/admin/users iniciado');
    console.log('[API] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[API] SUPABASE_SERVICE_ROLE_KEY definida:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Busca usuários do Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('[API] Erro em listUsers admin:', error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }
    
    const authUsers = data?.users || [];
    console.log('[API] Usuários do Auth carregados:', authUsers.length);
    
    // Busca dados complementares da tabela profiles
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone, role');
    
    if (profilesError) {
      console.error('[API] Erro ao buscar profiles:', profilesError);
    }
    
    // Combina dados dos usuários Auth com os profiles
    const profiles = profilesData || [];
    const usersWithProfiles = authUsers.map((authUser: any) => {
      const profile = profiles.find((p: any) => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || 'N/A',
        phone: profile?.phone || '',
        role: profile?.role || 'N/A',
      };
    });
    
    console.log('[API] Usuários com profiles carregados com sucesso:', usersWithProfiles.length);
    return NextResponse.json({ users: usersWithProfiles });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/admin/users:', err);
    const errorMessage = err.message || JSON.stringify(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
