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
        patient:patients(id, full_name),
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

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params;
    const saleId = params.id as string;
    const body = await request.json();
    const action = body.action;

    // Se action é 'cancel', processar cancelamento com restauração de estoque
    if (action === 'cancel') {
      const supabase = await createRouteClient();

      // Validar usuário e organização
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        return NextResponse.json({ error: 'Usuário sem organização' }, { status: 403 });
      }

      // Buscar venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .eq('organization_id', profile.organization_id)
        .single();

      if (saleError || !sale) {
        return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
      }

      // Verificar se já foi cancelada
      if (sale.status === 0) {
        return NextResponse.json({ error: 'Venda já foi cancelada' }, { status: 400 });
      }

      // Buscar todos os itens da venda
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);

      if (itemsError || !saleItems || saleItems.length === 0) {
        return NextResponse.json({ error: 'Nenhum item encontrado na venda' }, { status: 404 });
      }

      // FASE 4: Restaurar estoque para cada item
      const restoreLogs: any[] = [];

      for (const item of saleItems) {
        if (item.batch_id) {
          // Restaurar para batch específico
          const { data: batch, error: batchError } = await supabase
            .from('product_batches')
            .select('current_quantity')
            .eq('id', item.batch_id)
            .eq('organization_id', profile.organization_id)
            .single();

          if (batchError || !batch) {
            console.error(`[API] Lote não encontrado: ${item.batch_id}`);
            restoreLogs.push({
              item_id: item.id,
              batch_id: item.batch_id,
              status: 'error',
              message: 'Lote não encontrado',
            });
            continue;
          }

          const newQty = batch.current_quantity + item.quantity;

          const { error: updateError } = await supabase
            .from('product_batches')
            .update({
              current_quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.batch_id);

          if (updateError) {
            console.error(`[API] Erro ao restaurar batch: ${updateError.message}`);
            restoreLogs.push({
              item_id: item.id,
              batch_id: item.batch_id,
              status: 'error',
              message: updateError.message,
            });
          } else {
            restoreLogs.push({
              item_id: item.id,
              batch_id: item.batch_id,
              status: 'success',
              quantity_restored: item.quantity,
              old_qty: batch.current_quantity,
              new_qty: newQty,
            });

            // Criar log de auditoria para return
            await supabase.from('batch_operations_log').insert([
              {
                batch_id: item.batch_id,
                product_id: item.product_id,
                organization_id: profile.organization_id,
                operation_type: 'return',
                quantity_before: batch.current_quantity,
                quantity_after: newQty,
                quantity_delta: item.quantity,
                sale_id: saleId,
                sale_item_id: item.id,
                notes: `Cancelamento de venda #${saleId}`,
                created_by: user.id,
              },
            ]);
          }
        } else {
          // Item foi vendido sem lote específico (PVPS)
          // Restaurar para primeiro batch do produto
          const { data: firstBatch, error: batchError } = await supabase
            .from('product_batches')
            .select('*')
            .eq('product_id', item.product_id)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (batchError || !firstBatch) {
            restoreLogs.push({
              item_id: item.id,
              batch_id: null,
              status: 'warning',
              message: 'Nenhum lote disponível para restaurar',
            });
            continue;
          }

          const newQty = firstBatch.current_quantity + item.quantity;

          const { error: updateError } = await supabase
            .from('product_batches')
            .update({
              current_quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', firstBatch.id);

          if (updateError) {
            console.error(`[API] Erro ao restaurar batch: ${updateError.message}`);
            restoreLogs.push({
              item_id: item.id,
              batch_id: firstBatch.id,
              status: 'error',
              message: updateError.message,
            });
          } else {
            restoreLogs.push({
              item_id: item.id,
              batch_id: firstBatch.id,
              status: 'success',
              quantity_restored: item.quantity,
              old_qty: firstBatch.current_quantity,
              new_qty: newQty,
            });

            await supabase.from('batch_operations_log').insert([
              {
                batch_id: firstBatch.id,
                product_id: item.product_id,
                organization_id: profile.organization_id,
                operation_type: 'return',
                quantity_before: firstBatch.current_quantity,
                quantity_after: newQty,
                quantity_delta: item.quantity,
                sale_id: saleId,
                sale_item_id: item.id,
                notes: `Cancelamento (restauração automática) de venda #${saleId}`,
                created_by: user.id,
              },
            ]);
          }
        }
      }

      // Atualizar status da venda para cancelada (0)
      const { error: updateSaleError } = await supabase
        .from('sales')
        .update({
          status: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleId);

      if (updateSaleError) {
        console.error('[API] Erro ao atualizar status:', updateSaleError.message);
        return NextResponse.json({ error: 'Erro ao finalizar cancelamento' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Venda cancelada com sucesso',
        sale_id: saleId,
        restores: restoreLogs,
        total_items: saleItems.length,
        successful_restores: restoreLogs.filter((log: any) => log.status === 'success').length,
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] Erro ao processar POST /api/sales/[id]:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
