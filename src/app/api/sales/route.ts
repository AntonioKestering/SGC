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

    // FASE 3: Validar estoque disponível em batches antes de criar venda
    const batchValidations: Array<{ batch_id: string | null; product_id: string; quantity: number }> = [];
    
    for (const item of items) {
      if (item.batch_id) {
        // Se batch_id foi especificado, validar estoque neste batch
        const { data: batch, error: batchError } = await supabase
          .from('product_batches')
          .select('current_quantity')
          .eq('id', item.batch_id)
          .eq('organization_id', profile.organization_id)
          .single();

        if (batchError || !batch) {
          return NextResponse.json(
            { error: `Lote não encontrado ou não pertence a sua organização` },
            { status: 400 }
          );
        }

        if (batch.current_quantity < item.quantity) {
          return NextResponse.json(
            { 
              error: `Estoque insuficiente no lote. Disponível: ${batch.current_quantity}, Solicitado: ${item.quantity}` 
            },
            { status: 400 }
          );
        }

        batchValidations.push({ batch_id: item.batch_id, product_id: item.product_id, quantity: item.quantity });
      } else {
        // Se sem batch_id, validar estoque total do produto
        const { data: batches, error: batchesError } = await supabase
          .from('product_batches')
          .select('current_quantity')
          .eq('product_id', item.product_id)
          .eq('organization_id', profile.organization_id);

        if (batchesError) {
          return NextResponse.json({ error: 'Erro ao validar estoque' }, { status: 500 });
        }

        const totalAvailable = (batches || []).reduce((sum, b) => sum + (b.current_quantity || 0), 0);
        if (totalAvailable < item.quantity) {
          return NextResponse.json(
            { 
              error: `Estoque insuficiente. Disponível: ${totalAvailable}, Solicitado: ${item.quantity}` 
            },
            { status: 400 }
          );
        }

        batchValidations.push({ batch_id: null, product_id: item.product_id, quantity: item.quantity });
      }
    }

    // Calcular total
    let total_amount = 0;
    let subtotal = 0;

    for (const item of items) {
      const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
      subtotal += itemTotal;
      total_amount += itemTotal - (item.discount_amount || 0);
    }

    total_amount += tax_amount;

    // Criar venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          patient_id: patient_id || null,
          total_amount,
          subtotal,
          discount_amount: discount_amount || 0,
          tax_amount: tax_amount || 0,
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

    // Inserir itens da venda com batch_id
    const itemsToInsert = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      batch_id: item.batch_id || null, // NOVO: incluir batch_id
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount || 0,
      cost_price: item.cost_price || null,
      total_price: (item.quantity * item.unit_price) - (item.discount_amount || 0),
      sku: item.sku || null,
      tax_percent: item.tax_percent || 0,
      organization_id: profile.organization_id,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('[API] Erro ao inserir itens da venda:', itemsError.message);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // FASE 3: Consumir estoque dos batches
    for (const validation of batchValidations) {
      if (validation.batch_id) {
        // Decrementar estoque do batch específico
        const { error: updateError } = await supabase
          .from('product_batches')
          .update({ 
            current_quantity: supabase.rpc('increment', { 
              x: -validation.quantity 
            }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', validation.batch_id);

        if (updateError) {
          // Não fazer rollback automático por agora (Fase 4)
          console.error('[API] Erro ao atualizar estoque do batch:', updateError.message);
        }
      } else {
        // Consumir do(s) batch(es) com PVPS (expiry_date ASC)
        const { data: batches, error: batchesError } = await supabase
          .from('product_batches')
          .select('id, current_quantity')
          .eq('product_id', validation.product_id)
          .eq('organization_id', profile.organization_id)
          .order('expiry_date', { ascending: true });

        if (batchesError || !batches) continue;

        let remainingQty = validation.quantity;
        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const qtyToConsume = Math.min(remainingQty, batch.current_quantity);
          const newQty = batch.current_quantity - qtyToConsume;

          await supabase
            .from('product_batches')
            .update({ 
              current_quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', batch.id);

          remainingQty -= qtyToConsume;
        }
      }
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err: any) {
    console.error('[API] Erro ao processar POST /api/sales:', err);
    return NextResponse.json({ error: 'Erro interno ao criar venda' }, { status: 500 });
  }
}
