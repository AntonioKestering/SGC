// src/app/api/sales/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createRouteClient();

    // Validar usuário autenticado
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

    // Listar vendas da organização
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        patient:patients(id, full_name),
        sale_items(*)
      `)
      .eq('organization_id', profile.organization_id)
      .order('sale_date', { ascending: false });

    if (error) {
      console.error('[API] Erro ao buscar vendas:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sales: sales || [] });
  } catch (err: any) {
    console.error('[API] Erro ao processar GET /api/sales:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_id,
      items, // Array de { product_id, batch_id?, quantity, unit_price, discount_amount, cost_price, sku, tax_percent }
      payment_method,
      notes,
      discount_amount = 0,
      tax_amount = 0,
    } = body;

    // Validações básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Venda deve conter pelo menos 1 item' }, { status: 400 });
    }

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

    // FASE 3: Validar estoque disponível e planejar o consumo em lotes
    const finalItemsToInsert: any[] = [];
    const stockConsumptions: Array<{ batch_id: string; quantity: number }> = [];
    
    for (const item of items) {
      // Buscar todos os lotes do produto ordenados por vencimento (PVPS) - do mais próximo a vencer para o mais distante
      const { data: allBatches, error: errorBatches } = await supabase
        .from('product_batches')
        .select('id, current_quantity, expiry_date')
        .eq('product_id', item.product_id)
        .eq('organization_id', profile.organization_id)
        .order('expiry_date', { ascending: true });

      if (errorBatches) {
        return NextResponse.json({ error: 'Erro ao validar estoque do produto' }, { status: 500 });
      }

      const totalAvailable = (allBatches || []).reduce((sum, b) => sum + Number(b.current_quantity || 0), 0);
      const requestedQty = Number(item.quantity) || 0;
      
      if (totalAvailable < requestedQty) {
        return NextResponse.json(
          { 
            error: `Estoque insuficiente para o produto. Disponível: ${totalAvailable}, Solicitado: ${requestedQty}` 
          },
          { status: 400 }
        );
      }

      let remainingToAssign = requestedQty;
      const discountPerUnit = (Number(item.discount_amount) || 0) / (requestedQty || 1);
      
      // Consumo estrito por PVPS (Primeiro a Vencer, Primeiro a Sair)
      if (remainingToAssign > 0 && allBatches) {
        for (const batch of allBatches) {
          const currentBatchQty = Number(batch.current_quantity || 0);
          if (remainingToAssign <= 0) break;
          if (currentBatchQty <= 0) continue;

          const qtyToTake = Math.min(currentBatchQty, remainingToAssign);
          
          stockConsumptions.push({ batch_id: batch.id, quantity: qtyToTake });
          finalItemsToInsert.push({ 
            ...item, 
            batch_id: batch.id, 
            quantity: qtyToTake, 
            discount_amount: discountPerUnit * qtyToTake 
          });
          
          remainingToAssign -= qtyToTake;
          batch.current_quantity = currentBatchQty - qtyToTake;
        }
      }
    }

    // Calcular total
    let total_amount = 0;
    let subtotal = 0;

    for (const item of items) {
      const itemTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      subtotal += itemTotal;
      total_amount += itemTotal - (Number(item.discount_amount) || 0);
    }

    total_amount += Number(tax_amount || 0);

    // Criar venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          patient_id: patient_id || null,
          total_amount,
          subtotal,
          discount_amount: Number(discount_amount) || 0,
          tax_amount: Number(tax_amount) || 0,
          sale_date: new Date().toISOString(),
          organization_id: profile.organization_id,
          status: 1, // 1 = finalizada
          payment_method: payment_method ?? null,
          notes: notes || null,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (saleError) {
      console.error('[API] Erro ao criar venda:', saleError.message);
      return NextResponse.json({ error: saleError.message }, { status: 500 });
    }

    // Inserir itens da venda com batch_id rigorosamente selecionado pelo PVPS
    const itemsToInsertRecords = finalItemsToInsert.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      batch_id: item.batch_id || null,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      discount_amount: Number(item.discount_amount) || 0,
      cost_price: item.cost_price || null,
      total_price: (Number(item.quantity) * Number(item.unit_price)) - (Number(item.discount_amount) || 0),
      sku: item.sku || null,
      tax_percent: item.tax_percent || 0,
      organization_id: profile.organization_id,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsToInsertRecords);

    if (itemsError) {
      console.error('[API] Erro ao inserir itens da venda:', itemsError.message);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // FASE 3: Consumir estoque dos batches de forma agrupada
    const consumptionsByBatch = stockConsumptions.reduce((acc, cons) => {
      acc[cons.batch_id] = (acc[cons.batch_id] || 0) + Number(cons.quantity);
      return acc;
    }, {} as Record<string, number>);

    for (const [batchId, qty] of Object.entries(consumptionsByBatch)) {
      if (qty <= 0) continue;

      const { data: currentBatch, error: currentErr } = await supabase
        .from('product_batches')
        .select('current_quantity')
        .eq('id', batchId)
        .eq('organization_id', profile.organization_id)
        .single();
        
      if (currentErr) {
        console.error(`[API] Erro ao obter lote ${batchId}:`, currentErr.message);
        continue;
      }

      const currentQty = Number(currentBatch?.current_quantity || 0);
      const newQty = Math.max(0, currentQty - qty);

      const { error: updateError } = await supabase
        .from('product_batches')
        .update({ 
          current_quantity: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId)
        .eq('organization_id', profile.organization_id);

      if (updateError) {
        console.error(`[API] Erro ao diminuir estoque do lote ${batchId}:`, updateError.message);
      }
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err: any) {
    console.error('[API] Erro ao processar POST /api/sales:', err);
    return NextResponse.json({ error: 'Erro interno ao criar venda' }, { status: 500 });
  }
}
