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

    // 4. Executa a query
    // Graças ao RLS, o banco só retornará os produtos da organização do usuário logado
    const { data: products, error } = await supabase
      .from('products')
      .select('id, barcode, name, expiry_date, stock_quantity')
      .lt('expiry_date', end.toISOString().split('T')[0]) // Usamos apenas a parte YYYY-MM-DD
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('[API] Erro ao buscar produtos próximos do vencimento:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (err: any) {
    console.error('[API] Erro inesperado em GET /api/products/expiring:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}