// src/app/api/sales/[id]/cancel/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: saleId } = await params;
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
          // Log de erro mas continuar com outros itens
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
        // Não temos informação de qual lote foi consumido no detalhe
        // Opção 1: Adicionar ao first available batch (default)
        // Opção 2: Criar "batch de devolução" genérica
        // Opção 3: Registrar erro e não restaurar

        // Para esta implementação, vamos criar uma devolução genérica
        // buscando o primeiro batch do produto
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
            message: 'Nenhum lote disponível para restaurar - item não rastreado',
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
          console.error(`[API] Erro ao restaurar batch genérico: ${updateError.message}`);
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
            note: 'Restaurado para batch padrão (item não tinha rastreamento)',
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
              notes: `Cancelamento (restauração genérica) de venda #${saleId}`,
              created_by: user.id,
            },
          ]);
        }
      }
    }

    // Verificar se alguma restauração falhou
    const failedRestores = restoreLogs.filter(log => log.status === 'error');
    if (failedRestores.length > 0) {
      console.warn(`[API] ${failedRestores.length} itens falharam ao restaurar`);
    }

    // Atualizar status da venda para cancelada (0)
    const { error: updateSaleError } = await supabase
      .from('sales')
      .update({
        status: 0, // 0 = cancelada
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId);

    if (updateSaleError) {
      console.error('[API] Erro ao atualizar status da venda:', updateSaleError.message);
      return NextResponse.json(
        { error: 'Erro ao finalizar cancelamento' },
        { status: 500 }
      );
    }

    // Retornar sucesso com detalhes das restaurações
    return NextResponse.json(
      {
        message: 'Venda cancelada com sucesso',
        sale_id: saleId,
        restores: restoreLogs,
        total_items: saleItems.length,
        successful_restores: restoreLogs.filter(log => log.status === 'success').length,
        failed_restores: failedRestores.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API] Erro ao processar POST /api/sales/[id]/cancel:', err);
    return NextResponse.json({ error: 'Erro interno ao cancelar venda' }, { status: 500 });
  }
}
