// src/app/api/products/expiring/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    // 1. Inicializa o cliente que respeita os Cookies e o RLS
    const supabase = await createRouteClient();

    // 2. Verifica se o usuário está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Processa os parâmetros de data
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days') || '7';
    const days = Number(daysParam) || 7;

    const end = new Date();
    end.setDate(end.getDate() + days);

    // 4. Executa a query listando apenas lotes com estoque > 0 que vencem antes da data limite (end)
    // Usamos products!inner para garantir que o produto associado exista e trazer seus dados.
    const { data: batches, error } = await supabase
      .from('product_batches')
      .select('id, batch_number, current_quantity, expiry_date, products!inner(id, name, barcode)')
      .eq('organization_id', profile.organization_id)
      .gt('current_quantity', 0)
      .lte('expiry_date', end.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('[API] Erro ao buscar lotes próximos do vencimento:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mapeia os dados devolvendo no formato esperado pelo layout (simulando a estrutura antiga)
    const mappedProducts = (batches || []).map((b: any) => ({
      id: b.id, // O ID do lote sendo usado como key
      product_id: b.products?.id,
      name: b.products?.name,
      barcode: b.products?.barcode,
      expiry_date: b.expiry_date,
      stock_quantity: b.current_quantity,
      batch_number: b.batch_number || 'Sem número',
    }));

    return NextResponse.json({ products: mappedProducts });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/products/expiring:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}