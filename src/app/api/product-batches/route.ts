// src/app/api/product-batches/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
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

    // Buscar parâmetros de query (opcional: filtrar por product_id)
    const url = new URL(request.url);
    const productId = url.searchParams.get('product_id');

    let query = supabase
      .from('product_batches')
      .select('*')
      .eq('organization_id', profile.organization_id);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: batches, error } = await query.order('expiry_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ batches: batches || [] });
  } catch (err: any) {
    console.error('[API] Erro ao buscar lotes:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    const {
      product_id,
      batch_number,
      expiry_date,
      initial_quantity,
      cost_price,
    } = body;

    // Validações
    if (!product_id || !expiry_date || !initial_quantity) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: product_id, expiry_date, initial_quantity' },
        { status: 400 }
      );
    }

    // Criar lote
    const { data: batch, error } = await supabase
      .from('product_batches')
      .insert([
        {
          product_id,
          organization_id: profile.organization_id,
          batch_number: batch_number || null,
          expiry_date,
          initial_quantity,
          current_quantity: initial_quantity,
          cost_price: cost_price || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ batch }, { status: 201 });
  } catch (err: any) {
    console.error('[API] Erro ao criar lote:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
