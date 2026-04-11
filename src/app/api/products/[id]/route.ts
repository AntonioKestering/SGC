import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // O RLS filtrará automaticamente. Se o ID for de outra empresa,
    // o Supabase retornará erro de "não encontrado".
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Erro ao buscar produto:', error.message);
      return NextResponse.json({ error: 'Produto não encontrado ou acesso negado' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createRouteClient();

    // O update com createRouteClient só afetará a linha se o RLS permitir
    // (ou seja, se o organization_id do produto bater com o do usuário).
    const { data, error } = await supabase
      .from('products')
      .update({
        supplier_id: body.supplier_id || null,
        name: body.name,
        description: body.description || null,
        barcode: body.barcode || null,
        price_sale: body.price_sale || null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[API] Erro ao atualizar produto:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado ou sem permissão' }, { status: 403 });
    }

    return NextResponse.json({ product: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao processar atualização' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    // O delete só será executado se o RLS validar a posse do registro.
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar produto:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}