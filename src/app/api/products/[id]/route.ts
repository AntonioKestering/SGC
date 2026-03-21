// src/app/api/products/[id]/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Erro ao buscar produto:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/products/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        supplier_id: body.supplier_id || null,
        name: body.name,
        description: body.description || null,
        barcode: body.barcode || null,
        stock_quantity: typeof body.stock_quantity === 'number' ? body.stock_quantity : (body.stock_quantity ? Number(body.stock_quantity) : 0),
        expiry_date: body.expiry_date || null,
        price: body.price || null,
        price_sale: body.price_sale || null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[API] Erro ao atualizar produto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data?.[0] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em PUT /api/products/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar produto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro inesperado em DELETE /api/products/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
