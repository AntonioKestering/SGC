// src/app/api/user/organizations/route.ts

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

/**
 * GET /api/user/organizations
 * Retorna todas as organizações às quais o usuário autenticado pertence
 * 
 * Resposta Esperada:
 * {
 *   organizations: [
 *     { id: "uuid-1", name: "Clínica A", role: "admin" },
 *     { id: "uuid-2", name: "Clínica B", role: "especialista" }
 *   ],
 *   currentOrganizationId: "uuid-1" // organization_id atual do usuário
 * }
 */
export async function GET() {
  try {
    const supabase = await createRouteClient();

    // 1. Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Obter perfil do usuário (role + organization_id atual)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // 3. Buscar TODAS as organizações às quais este usuário pertence
    //    (via a tabela profiles que conecta users → organizations)
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('organization_id, role, organizations:organization_id(id, name)')
      .eq('id', user.id)
      .not('organization_id', 'is', null);

    // 4. Construir lista de organizações disponíveis
    const organizations = (userProfiles || [])
      .filter(p => p.organizations && Array.isArray(p.organizations) && p.organizations.length > 0) // Remove null organizations
      .map(p => {
        const org = Array.isArray(p.organizations) ? p.organizations[0] : p.organizations;
        return {
          id: org?.id,
          name: org?.name,
          role: p.role,
        };
      });

    // 5. Remover duplicatas por ID
    const uniqueOrgs = Array.from(
      new Map(organizations.map(org => [org.id, org])).values()
    );

    return NextResponse.json({
      organizations: uniqueOrgs,
      currentOrganizationId: profile.organization_id,
    });
  } catch (err: any) {
    console.error('[API] Erro ao buscar organizações:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar organizações' },
      { status: 500 }
    );
  }
}
