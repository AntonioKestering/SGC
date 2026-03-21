// src/app/api/products/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    console.log('[API] GET /api/products iniciado');

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Erro ao buscar produtos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/products:', err);
    return NextResponse.json({ error: err.message || 'Erro ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, barcode, stock_quantity, expiry_date, price, price_sale, supplier_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          supplier_id: supplier_id || null,
          name,
          description: description || null,
          barcode: barcode || null,
          stock_quantity: typeof stock_quantity === 'number' ? stock_quantity : (stock_quantity ? Number(stock_quantity) : 0),
          expiry_date: expiry_date || null,
          price: price || null,
          price_sale: price_sale || null,
        },
      ])
      .select();

    if (error) {
      console.error('[API] Erro ao criar produto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data?.[0] }, { status: 201 });
  } catch (err: any) {
    console.error('[API] Erro inesperado em POST /api/products:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar produto' }, { status: 500 });
  }
}
