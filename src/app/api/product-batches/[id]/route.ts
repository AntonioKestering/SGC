// src/app/api/product-batches/[id]/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const batchId = params.id as string;

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

    // Buscar lote
    const { data: batch, error } = await supabase
      .from('product_batches')
      .select('*')
      .eq('id', batchId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !batch) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (err: any) {
    console.error('[API] Erro ao buscar lote:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params;
    const batchId = params.id as string;
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

    // Verificar propriedade do lote
    const { data: batch } = await supabase
      .from('product_batches')
      .select('organization_id')
      .eq('id', batchId)
      .single();

    if (!batch || batch.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Atualizar lote
    const { data: updated, error } = await supabase
      .from('product_batches')
      .update({
        batch_number: body.batch_number ?? undefined,
        expiry_date: body.expiry_date ?? undefined,
        current_quantity: body.current_quantity ?? undefined,
        cost_price: body.cost_price ?? undefined
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ batch: updated });
  } catch (err: any) {
    console.error('[API] Erro ao atualizar lote:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const batchId = params.id as string;

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

    // Verificar propriedade do lote
    const { data: batch } = await supabase
      .from('product_batches')
      .select('organization_id')
      .eq('id', batchId)
      .single();

    if (!batch || batch.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Deletar lote (só permite se current_quantity = 0)
    const { data: batchDetail } = await supabase
      .from('product_batches')
      .select('current_quantity')
      .eq('id', batchId)
      .single();

    if (batchDetail?.current_quantity !== 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar um lote com estoque disponível' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_batches')
      .delete()
      .eq('id', batchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro ao deletar lote:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
