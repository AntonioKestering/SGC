// src/app/api/sales/[id]/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const saleId = params.id as string;

    const supabase = await createRouteClient();

    // Validar usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Obter organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // Buscar venda com validação de organização
    const { data: sale, error } = await supabase
      .from('sales')
      .select(`
        *,
        patient:patients(id, name),
        sale_items(
          *,
          product:products(id, name, barcode, price_sale)
        )
      `)
      .eq('id', saleId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (err: any) {
    console.error('[API] Erro ao buscar venda:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params;
    const saleId = params.id as string;
    const body = await request.json();

    const supabase = await createRouteClient();

    // Validar usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Obter organização
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // Verificar se venda pertence à organização
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('id, organization_id')
      .eq('id', saleId)
      .single();

    if (fetchError || !sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    if (sale.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Atualizar venda
    const { data: updated, error: updateError } = await supabase
      .from('sales')
      .update({
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Erro ao atualizar venda:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ sale: updated });
  } catch (err: any) {
    console.error('[API] Erro ao processar PUT /api/sales/[id]:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const saleId = params.id as string;

    const supabase = await createRouteClient();

    // Validar usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Obter organização
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
    }

    // Verificar se venda pertence à organização
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('id, organization_id')
      .eq('id', saleId)
      .single();

    if (fetchError || !sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    if (sale.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Apenas marcar como cancelada (soft delete)
    const { error: deleteError } = await supabase
      .from('sales')
      .update({ status: -1, updated_at: new Date().toISOString() })
      .eq('id', saleId);

    if (deleteError) {
      console.error('[API] Erro ao cancelar venda:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Venda cancelada com sucesso' });
  } catch (err: any) {
    console.error('[API] Erro ao processar DELETE /api/sales/[id]:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
