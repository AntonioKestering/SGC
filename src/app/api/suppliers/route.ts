// src/app/api/suppliers/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

/**
 * GET /api/suppliers
 * Retorna lista de fornecedores da organização do usuário
 */
export async function GET() {
  try {
    const supabase = await createRouteClient();

    // 1. Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Obter organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // 3. Buscar fornecedores da organização (SEGURANÇA: força organization_id)
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('company_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ suppliers: suppliers || [] });
  } catch (err: any) {
    console.error('[API] Erro ao buscar fornecedores:', err);
    return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 });
  }
}

/**
 * POST /api/suppliers
 * Cria novo fornecedor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_name, cnpj, contact_name, phone } = body;

    // 1. Validação básica
    if (!company_name || company_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createRouteClient();

    // 2. Obter usuário e sua organização
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // 3. Criar novo fornecedor
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        company_name: company_name.trim(),
        cnpj: cnpj?.trim() || null,
        contact_name: contact_name?.trim() || null,
        phone: phone?.trim() || null,
        organization_id: profile.organization_id,
      }])
      .select();

    if (error) {
      console.error('[API] Erro ao criar fornecedor:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ supplier: data?.[0] }, { status: 201 });
  } catch (err: any) {
    console.error('[API] Erro no servidor:', err);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
