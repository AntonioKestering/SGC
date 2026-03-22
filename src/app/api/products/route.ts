// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    // Usamos o createRouteClient para respeitar os Cookies e o RLS
    const supabase = await createRouteClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Erro ao buscar produtos:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, barcode, stock_quantity, expiry_date, price, price_sale, supplier_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório' }, { status: 400 });
    }

    const supabase = await createRouteClient();

    // 1. Validar usuário e obter sua organização
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Usuário sem organização vinculada' }, { status: 403 });
    }

    // 2. Inserir produto vinculado à organização do usuário
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description: description || null,
          barcode: barcode || null,
          stock_quantity: Number(stock_quantity) || 0,
          expiry_date: expiry_date || null,
          price: price || null,
          price_sale: price_sale || null,
          supplier_id: supplier_id || null,
          organization_id: profile.organization_id, // VÍNCULO OBRIGATÓRIO
        },
      ])
      .select();

    if (error) {
      console.error('[API] Erro ao criar produto:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno ao criar produto' }, { status: 500 });
  }
}