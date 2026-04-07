// src/app/api/suppliers/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

/**
 * GET /api/suppliers/[id]
 * Retorna dados de um fornecedor específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createRouteClient();

    // 1. Obter usuário e sua organização (validação de segurança)
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

    // 2. Buscar fornecedor com validação de organização (SEGURANÇA)
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !supplier) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier });
  } catch (err: any) {
    console.error('[API] Erro ao buscar fornecedor:', err);
    return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 });
  }
}

/**
 * PUT /api/suppliers/[id]
 * Atualiza um fornecedor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { company_name, cnpj, contact_name, phone } = body;

    if (!company_name || company_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createRouteClient();

    // 1. Validar usuário e organização
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

    // 2. Verificar se fornecedor pertence à organização do usuário
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // 3. Atualizar fornecedor
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        company_name: company_name.trim(),
        cnpj: cnpj?.trim() || null,
        contact_name: contact_name?.trim() || null,
        phone: phone?.trim() || null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[API] Erro ao atualizar fornecedor:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ supplier: data?.[0] });
  } catch (err: any) {
    console.error('[API] Erro no servidor:', err);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Deleta um fornecedor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createRouteClient();

    // 1. Validar usuário e organização
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

    // 2. Verificar se fornecedor pertence à organização do usuário
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // 3. Deletar fornecedor
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar fornecedor:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Fornecedor deletado com sucesso' });
  } catch (err: any) {
    console.error('[API] Erro no servidor:', err);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
