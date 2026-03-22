// src/app/api/products/expiring/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return { error: 'Unauthorized' };

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function GET(request: Request) {
  try {
    const u = await getUserFromAuthHeader(request);
    if ((u as any).error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days') || '7';
    const days = Number(daysParam) || 7;

    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + days);

    const supabaseAdmin = getSupabaseAdmin();
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, barcode, name, expiry_date, stock_quantity')
      // Removemos o .gt() para incluir os já vencidos (datas no passado)
      .lt('expiry_date', end.toISOString()) 
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('[API] Erro ao buscar produtos próximos do vencimento:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (err: any) {
    console.error('[API] Erro em GET /api/products/expiring:', err);
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 });
  }
}
